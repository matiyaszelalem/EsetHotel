import { NextResponse } from 'next/server'
import ical from 'ical-generator'
import { queryOne, query } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ icalToken: string }> }
) {
  try {
    const { icalToken } = await params

    const roomType = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM room_type WHERE ical_token = $1',
      [icalToken]
    )

    if (!roomType) {
      return new NextResponse('Room type not found', { status: 404 })
    }

    const cal = ical({ name: `Eset Hotel - ${roomType.name}` })

    const bookedRooms = await query<{
      booking_id: string
      room_id: string
      check_in: string
      check_out: string
      reference_id: string
      guest_name: string
      room_number: string
    }>(
      `SELECT br.booking_id, br.room_id, b.check_in, b.check_out,
              b.reference_id, b.guest_name, r.room_number
       FROM booking_room br
       JOIN booking b ON b.id = br.booking_id
       JOIN room r ON r.id = br.room_id
       WHERE r.room_type_id = $1
       AND b.status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')`,
      [roomType.id]
    )

    for (const br of bookedRooms) {
      cal.createEvent({
        start: new Date(br.check_in),
        end: new Date(br.check_out),
        summary: `Reserved - ${br.room_number}`,
        description: `Booking REF: ${br.reference_id}\nGuest: ${br.guest_name}`,
        url: `https://esethotel.com/dashboard/bookings/${br.booking_id}`,
      })
    }

    const headers = new Headers()
    headers.set('Content-Type', 'text/calendar; charset=utf-8')
    headers.set('Content-Disposition', `attachment; filename="${roomType.name.replace(/\s+/g, '_')}_calendar.ics"`)

    return new NextResponse(cal.toString(), {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error generating iCal:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
