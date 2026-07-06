import { NextResponse } from 'next/server'
import { query, queryOne, transaction } from '@/lib/db'

function parseIcsEvents(icsData: string): Array<{
  uid: string
  start: Date
  end: Date
  summary: string
}> {
  const events: Array<{
    uid: string
    start: Date
    end: Date
    summary: string
  }> = []

  const veventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi
  let match: RegExpExecArray | null

  while ((match = veventRegex.exec(icsData)) !== null) {
    const block = match[1]

    const getValue = (key: string): string => {
      const re = new RegExp(`^${key}[^:]*:(.*)$`, 'm')
      const m = block.match(re)
      return m ? m[1].trim() : ''
    }

    const uid = getValue('UID') || `ical-${Math.random().toString(36).substring(2, 10)}`
    const dtStartStr = getValue('DTSTART')
    const dtEndStr = getValue('DTEND')
    const summary = getValue('SUMMARY') || 'OTA Booking'

    if (!dtStartStr || !dtEndStr) continue

    const parseIcsDate = (str: string): Date => {
      const clean = str.replace(/^TZID=[^:]+:/i, '').replace(/Z$/i, '')
      if (/^\d{8}T\d{6}$/.test(clean)) {
        const year = clean.slice(0, 4)
        const month = clean.slice(4, 6)
        const day = clean.slice(6, 8)
        const hour = clean.slice(9, 11)
        const min = clean.slice(11, 13)
        const sec = clean.slice(13, 15)
        return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}${str.endsWith('Z') ? 'Z' : ''}`)
      }
      return new Date(str)
    }

    let dtStart: Date
    let dtEnd: Date

    try {
      dtStart = parseIcsDate(dtStartStr)
      dtEnd = parseIcsDate(dtEndStr)
    } catch {
      continue
    }

    if (isNaN(dtStart.getTime()) || isNaN(dtEnd.getTime())) continue

    events.push({ uid, start: dtStart, end: dtEnd, summary })
  }

  return events
}

export async function POST(req: Request) {
  const session = null
  if (false) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { roomTypeId, icalUrl } = body

    if (!roomTypeId || !icalUrl) {
      return NextResponse.json({ error: 'roomTypeId and icalUrl are required' }, { status: 400 })
    }

    const roomType = await queryOne<{ id: string; name: string; base_price: number; capacity: number }>(
      'SELECT id, name, base_price, capacity FROM room_type WHERE id = $1',
      [roomTypeId]
    )

    if (!roomType) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }

    await query(
      'UPDATE room_type SET ical_import_url = $1 WHERE id = $2',
      [icalUrl, roomTypeId]
    )

    const response = await fetch(icalUrl)
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch iCal feed: ${response.statusText}` }, { status: 400 })
    }

    const icalData = await response.text()
    const events = parseIcsEvents(icalData)

    let importedCount = 0
    let skippedCount = 0
    let updatedCount = 0

    for (const event of events) {
      const dtStart = new Date(event.start)
      const dtEnd = new Date(event.end)

      dtStart.setHours(14, 0, 0, 0)
      dtEnd.setDate(dtEnd.getDate() - 1)
      dtEnd.setHours(11, 0, 0, 0)

      if (dtStart >= dtEnd) {
        skippedCount++
        continue
      }

      const existingBooking = await queryOne<{ id: string }>(
        'SELECT id FROM booking WHERE external_uid = $1',
        [event.uid]
      )

      if (existingBooking) {
        await transaction(async (tx) => {
          await tx.execute(
            `INSERT INTO booking
               (reference_id, external_uid, guest_name, guest_email, check_in, check_out,
                status, payment_method, source, total_price, currency, created_at, updated_at)
             VALUES
               ($1, $2, 'OTA Guest', '', $3, $4,
                'CONFIRMED', 'PAY_AT_HOTEL', 'OTA', 0, 'USD', NOW(), NOW())
             ON CONFLICT (external_uid) DO UPDATE
               SET check_in   = EXCLUDED.check_in,
                   check_out  = EXCLUDED.check_out,
                   updated_at = NOW()`,
            [`OTA-${event.uid}`, event.uid, dtStart.toISOString(), dtEnd.toISOString()]
          )
        })
        updatedCount++
        continue
      }

      const bookedRoomIds = (
        await query<{ room_id: string }>(
          `SELECT DISTINCT br.room_id FROM booking_room br
           JOIN booking b ON b.id = br.booking_id
           JOIN room r ON r.id = br.room_id
           WHERE b.status NOT IN ('CANCELLED', 'NO_SHOW')
           AND r.room_type_id = $1
           AND b.check_in < $3
           AND b.check_out > $2`,
          [roomTypeId, dtEnd.toISOString(), dtStart.toISOString()]
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

      if (!availableRoom) {
        skippedCount++
        continue
      }

      await transaction(async (tx) => {
        const booking = await tx.queryOne<{ id: string }>(
          `INSERT INTO booking
             (reference_id, external_uid, guest_name, guest_email, check_in, check_out,
              status, payment_method, source, total_price, currency, created_at, updated_at)
           VALUES
             ($1, $2, 'OTA Guest', '', $3, $4,
              'CONFIRMED', 'PAY_AT_HOTEL', 'OTA', 0, 'USD', NOW(), NOW())
           ON CONFLICT (external_uid) DO UPDATE
             SET check_in   = EXCLUDED.check_in,
                 check_out  = EXCLUDED.check_out,
                 updated_at = NOW()
           RETURNING id`,
          [`OTA-${event.uid}`, event.uid, dtStart.toISOString(), dtEnd.toISOString()]
        )

        await tx.execute(
          'INSERT INTO booking_room (booking_id, room_id, price_per_night) VALUES ($1, $2, $3)',
          [booking!.id, availableRoom.id, roomType.base_price]
        )

        await tx.execute(
          'INSERT INTO payment (booking_id, amount, status) VALUES ($1, $2, $3)',
          [booking!.id, 0, 'PENDING']
        )
      })

      importedCount++
    }

    return NextResponse.json({
      imported: importedCount,
      updated: updatedCount,
      skipped: skippedCount,
      total: events.length,
    })
  } catch (error: any) {
    console.error('Error importing iCal:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
