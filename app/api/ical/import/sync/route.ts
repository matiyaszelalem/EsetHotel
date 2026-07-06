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

export async function GET() {
  const session = null
  if (false) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const roomTypes = await query<{ id: string; name: string; base_price: number; capacity: number; ical_import_url: string | null }>(
      "SELECT id, name, base_price, capacity, ical_import_url FROM room_type WHERE ical_import_url IS NOT NULL"
    )

    const results: { roomTypeId: string; roomTypeName: string; imported: number; skipped: number }[] = []

    for (const roomType of roomTypes) {
      if (!roomType.ical_import_url) continue

      try {
        const response = await fetch(roomType.ical_import_url)
        if (!response.ok) {
          results.push({
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            imported: 0,
            skipped: 0,
          })
          continue
        }

        const icalData = await response.text()
        const events = parseIcsEvents(icalData)

        let importedCount = 0
        let skippedCount = 0

        for (const event of events) {
          const existing = await queryOne<{ id: string }>(
            'SELECT id FROM booking WHERE reference_id = $1',
            [`OTA-${event.uid}`]
          )

          if (existing) {
            skippedCount++
            continue
          }

          const dtStart = new Date(event.start)
          const dtEnd = new Date(event.end)
          dtStart.setHours(14, 0, 0, 0)
          dtEnd.setDate(dtEnd.getDate() - 1)
          dtEnd.setHours(11, 0, 0, 0)

          if (dtStart >= dtEnd) {
            skippedCount++
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
              [roomType.id, dtEnd.toISOString(), dtStart.toISOString()]
            )
          ).map(r => r.room_id)

          const availableRoom = bookedRoomIds.length > 0
            ? await queryOne<{ id: string }>(
                `SELECT id FROM room
                 WHERE room_type_id = $1
                 AND id != ALL($2)
                 AND status != 'MAINTENANCE'
                 LIMIT 1`,
                [roomType.id, bookedRoomIds]
              )
            : await queryOne<{ id: string }>(
                `SELECT id FROM room
                 WHERE room_type_id = $1
                 AND status != 'MAINTENANCE'
                 LIMIT 1`,
                [roomType.id]
              )

          if (!availableRoom) {
            skippedCount++
            continue
          }

          const nights = Math.ceil(
            (dtEnd.getTime() - dtStart.getTime()) / (1000 * 60 * 60 * 24)
          )
          const totalPrice = nights * roomType.base_price

          await transaction(async (tx) => {
            const booking = await tx.queryOne<{ id: string }>(
              `INSERT INTO booking (reference_id, guest_name, guest_email, check_in, check_out,
                guests, status, payment_method, total_price, source)
               VALUES ($1, $2, $3, $4, $5, $6, 'CONFIRMED', 'PAY_AT_HOTEL', $7, 'OTA')
               RETURNING id`,
              [
                `OTA-${event.uid}`,
                event.summary || 'OTA Guest',
                'ota-guest@esethotel.com',
                dtStart.toISOString(),
                dtEnd.toISOString(),
                roomType.capacity,
                totalPrice,
              ]
            )

            await tx.execute(
              'INSERT INTO booking_room (booking_id, room_id, price_per_night) VALUES ($1, $2, $3)',
              [booking!.id, availableRoom.id, roomType.base_price]
            )

            await tx.execute(
              'INSERT INTO payment (booking_id, amount, status) VALUES ($1, $2, $3)',
              [booking!.id, totalPrice, 'PENDING']
            )
          })

          importedCount++
        }

        results.push({
          roomTypeId: roomType.id,
          roomTypeName: roomType.name,
          imported: importedCount,
          skipped: skippedCount,
        })
      } catch (err) {
        results.push({
          roomTypeId: roomType.id,
          roomTypeName: roomType.name,
          imported: 0,
          skipped: 0,
        })
      }
    }

    return NextResponse.json({ synced: results.length, results })
  } catch (error: any) {
    console.error('Error syncing iCal feeds:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
