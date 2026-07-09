import { createDemoProvider } from './demo-provider'
import type {
  ChannelProvider,
  SyncResult,
  AvailabilityUpdate,
  RateUpdate,
  ConnectionTestResult,
} from './types'
import { query, queryOne, transaction } from '@/lib/db'

const SYNC_WINDOW_DAYS = 180

function getProvider(channelName: string, channelSlug: string): ChannelProvider {
  return createDemoProvider(channelName, channelSlug)
}

export class ChannelManager {

  async testConnection(channelId: string): Promise<ConnectionTestResult> {
    const channel = await queryOne<{
      id: string; name: string; slug: string; api_key: string | null; api_secret: string | null; status: string
    }>('SELECT * FROM channel WHERE id = $1', [channelId])
    if (!channel) throw new Error('Channel not found')

    const provider = getProvider(channel.name, channel.slug)
    const result = await provider.testConnection(channel.api_key ?? undefined, channel.api_secret ?? undefined)

    await query(
      'UPDATE channel SET status = $1 WHERE id = $2',
      [
        result.success ? (channel.api_key ? 'CONNECTED' : 'DEMO') : 'ERROR',
        channelId,
      ]
    )

    return result
  }

  async pushAvailability(channelId: string): Promise<SyncResult> {
    const channel = await queryOne<{
      id: string; name: string; slug: string; api_key: string | null; status: string
    }>('SELECT * FROM channel WHERE id = $1', [channelId])

    if (!channel) throw new Error('Channel not found')

    const mappings = await query<{
      id: string; channel_id: string; room_type_id: string; external_room_code: string; rate_code: string | null; sync_enabled: boolean
    }>('SELECT * FROM channel_mapping WHERE channel_id = $1 AND sync_enabled = true', [channelId])

    const updates: AvailabilityUpdate[] = []

    for (const mapping of mappings) {
      const totalRooms = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM room WHERE room_type_id = $1 AND status != 'MAINTENANCE'",
        [mapping.room_type_id]
      )

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + SYNC_WINDOW_DAYS)

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d)
        date.setHours(0, 0, 0, 0)

        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)

        const bookedCount = await queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM booking_room br
           JOIN booking b ON b.id = br.booking_id
           WHERE br.room_id IN (SELECT id FROM room WHERE room_type_id = $1)
           AND b.status IN ('CONFIRMED', 'CHECKED_IN')
           AND b.check_in < $3
           AND b.check_out > $2`,
          [mapping.room_type_id, date.toISOString(), nextDay.toISOString()]
        )

        const total = parseInt(totalRooms!.count)
        const booked = parseInt(bookedCount!.count)

        updates.push({
          externalRoomCode: mapping.external_room_code,
          date: date.toISOString().split('T')[0],
          available: Math.max(0, total - booked),
        })
      }
    }

    const provider = getProvider(channel.name, channel.slug)
    const result = await provider.pushAvailability(updates)

    await query(
      `INSERT INTO channel_sync_log (channel_id, action, status, details, item_count)
       VALUES ($1, 'AVAILABILITY_PUSH', $2, $3, $4)`,
      [channelId, result.status, JSON.stringify(result.details), result.itemCount]
    )

    await query(
      'UPDATE channel SET last_sync_at = NOW() WHERE id = $1',
      [channelId]
    )

    return result
  }

  async pushRates(channelId: string): Promise<SyncResult> {
    const channel = await queryOne<{ id: string; name: string; slug: string }>(
      'SELECT id, name, slug FROM channel WHERE id = $1',
      [channelId]
    )
    if (!channel) throw new Error('Channel not found')

    const mappings = await query<{
      id: string; room_type_id: string; external_room_code: string; rate_code: string | null; sync_enabled: boolean
    }>('SELECT * FROM channel_mapping WHERE channel_id = $1 AND sync_enabled = true', [channelId])

    const updates: RateUpdate[] = []

    for (const mapping of mappings) {
      const roomType = await queryOne<{ base_price: number }>(
        'SELECT base_price FROM room_type WHERE id = $1',
        [mapping.room_type_id]
      )

      if (!roomType) continue

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 1)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + SYNC_WINDOW_DAYS)

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d)

        updates.push({
          externalRoomCode: mapping.external_room_code,
          rateCode: mapping.rate_code ?? undefined,
          date: date.toISOString().split('T')[0],
          price: roomType.base_price,
          currency: 'USD',
        })
      }
    }

    const provider = getProvider(channel.name, channel.slug)
    const result = await provider.pushRates(updates)

    await query(
      `INSERT INTO channel_sync_log (channel_id, action, status, details, item_count)
       VALUES ($1, 'RATE_PUSH', $2, $3, $4)`,
      [channelId, result.status, JSON.stringify(result.details), result.itemCount]
    )

    await query(
      'UPDATE channel SET last_sync_at = NOW() WHERE id = $1',
      [channelId]
    )

    return result
  }

  async pullReservations(channelId: string): Promise<{
    result: SyncResult
    importedCount: number
  }> {
    const channel = await queryOne<{
      id: string; name: string; slug: string; last_sync_at: string | null
    }>('SELECT * FROM channel WHERE id = $1', [channelId])
    if (!channel) throw new Error('Channel not found')

    const mappings = await query<{
      id: string; channel_id: string; room_type_id: string; external_room_code: string; rate_code: string | null; sync_enabled: boolean
    }>('SELECT * FROM channel_mapping WHERE channel_id = $1', [channelId])

    const provider = getProvider(channel.name, channel.slug)
    const { result, reservations } = await provider.pullReservations(channel.last_sync_at ? new Date(channel.last_sync_at) : undefined)

    let importedCount = 0

    for (const res of reservations) {
      const mapping = mappings.find(
        (m) => m.external_room_code === res.roomCode
      )

      const roomTypeId = mapping?.room_type_id ?? mappings[0]?.room_type_id
      if (!roomTypeId) continue

      const refId = `OTA-${channel.slug}-${res.externalId}`
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM booking WHERE reference_id = $1',
        [refId]
      )
      if (existing) continue

      const bookedRoomIds = (
        await query<{ room_id: string }>(
          `SELECT DISTINCT br.room_id FROM booking_room br
           JOIN booking b ON b.id = br.booking_id
           JOIN room r ON r.id = br.room_id
           WHERE b.status NOT IN ('CANCELLED', 'NO_SHOW')
           AND r.room_type_id = $1
           AND b.check_in < $3
           AND b.check_out > $2`,
          [roomTypeId, res.checkOut.toISOString(), res.checkIn.toISOString()]
        )
      ).map(r => r.room_id)

      const availableRoom = bookedRoomIds.length > 0
        ? await queryOne<{ id: string }>(
            `SELECT id FROM room
             WHERE room_type_id = $1
             AND id != ALL($2)
             AND status != 'MAINTENANCE'
             LIMIT 1`,
            [roomTypeId, bookedRoomIds]
          )
        : await queryOne<{ id: string }>(
            `SELECT id FROM room
             WHERE room_type_id = $1
             AND status != 'MAINTENANCE'
             LIMIT 1`,
            [roomTypeId]
          )

      if (!availableRoom) continue

      const roomType = await queryOne<{ base_price: number }>(
        'SELECT base_price FROM room_type WHERE id = $1',
        [roomTypeId]
      )
      if (!roomType) continue

      await transaction(async (tx) => {
        const booking = await tx.queryOne<{ id: string }>(
          `INSERT INTO booking (reference_id, guest_name, guest_email, guest_phone,
            special_requests, check_in, check_out, guests, status, payment_method,
            total_price, currency, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONFIRMED', 'hotel', $9, $10, 'OTA')
           RETURNING id`,
          [
            refId,
            res.guestName,
            res.guestEmail,
            res.guestPhone || null,
            res.specialRequests || null,
            res.checkIn.toISOString(),
            res.checkOut.toISOString(),
            res.guests,
            res.totalPrice,
            res.currency,
          ]
        )

        await tx.execute(
          'INSERT INTO booking_room (booking_id, room_id, price_per_night) VALUES ($1, $2, $3)',
          [booking!.id, availableRoom.id, roomType.base_price]
        )

        await tx.execute(
          'INSERT INTO payment (booking_id, amount, status) VALUES ($1, $2, $3)',
          [booking!.id, res.totalPrice, 'PENDING']
        )
      })

      importedCount++
    }

    await query(
      `INSERT INTO channel_sync_log (channel_id, action, status, details, item_count)
       VALUES ($1, 'RESERVATION_PULL', $2, $3, $4)`,
      [channelId, result.status, JSON.stringify({
        ...result.details,
        importedCount,
        totalReservations: reservations.length,
      }), importedCount]
    )

    await query(
      'UPDATE channel SET last_sync_at = NOW() WHERE id = $1',
      [channelId]
    )

    return { result, importedCount }
  }

  async fullSync(channelId: string): Promise<{
    availability: SyncResult
    rates: SyncResult
    reservations: SyncResult
    importedCount: number
  }> {
    const availability = await this.pushAvailability(channelId)
    const rates = await this.pushRates(channelId)
    const { result: reservations, importedCount } = await this.pullReservations(channelId)

    const overallStatus =
      availability.status === 'FAILED' || rates.status === 'FAILED' || reservations.status === 'FAILED'
        ? 'FAILED'
        : availability.status === 'PARTIAL' || rates.status === 'PARTIAL' || reservations.status === 'PARTIAL'
          ? 'PARTIAL'
          : 'SUCCESS'

    await query(
      `INSERT INTO channel_sync_log (channel_id, action, status, details, item_count)
       VALUES ($1, 'FULL_SYNC', $2, $3, $4)`,
      [channelId, overallStatus, JSON.stringify({
        message: `Full sync completed: Availability=${availability.status}, Rates=${rates.status}, Reservations=${reservations.status}`,
        availability: availability.details,
        rates: rates.details,
        reservations: reservations.details,
        importedCount,
      }), availability.itemCount + rates.itemCount + importedCount]
    )

    return { availability, rates, reservations, importedCount }
  }

  async pushAvailabilityToAll(): Promise<void> {
    const channels = await query<{ id: string; name: string }>(
      "SELECT id, name FROM channel WHERE status IN ('DEMO', 'CONNECTED')"
    )

    for (const channel of channels) {
      const mappings = await query<{ id: string }>(
        'SELECT id FROM channel_mapping WHERE channel_id = $1 AND sync_enabled = true LIMIT 1',
        [channel.id]
      )
      if (mappings.length === 0) continue
      try {
        await this.pushAvailability(channel.id)
      } catch (error) {
        console.error(`Failed to push availability to ${channel.name}:`, error)
      }
    }
  }
}

export const channelManager = new ChannelManager()
