import { NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const booking = await queryOne(
      `SELECT b.id, b.reference_id, b.guest_name, b.guest_email, b.guest_phone,
              b.check_in, b.check_out, b.status, b.total_price, b.payment_method,
              b.source, b.special_requests, b.guest_count, b.created_at, b.checked_in_at, b.checked_out_at,
              (SELECT row_to_json(p) FROM (SELECT id, amount, status, created_at FROM payment WHERE booking_id = b.id LIMIT 1) p) as payment
       FROM booking b WHERE b.id = $1`, [id]
    )
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const rooms = await query(
      `SELECT json_build_object(
         'id', r.id, 'roomNumber', r.room_number, 'status', r.status,
         'roomType', json_build_object('id', rt.id, 'name', rt.name, 'slug', rt.slug, 'basePrice', rt.base_price, 'description', rt.description)
       ) as room
       FROM booking_room br
       JOIN room r ON r.id = br.room_id
       JOIN room_type rt ON rt.id = r.room_type_id
       WHERE br.booking_id = $1`, [id]
    )

    return NextResponse.json({
      ...booking,
      totalPrice: parseFloat(booking.total_price),
      referenceId: booking.reference_id,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      guestPhone: booking.guest_phone,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      paymentMethod: booking.payment_method,
      specialRequests: booking.special_requests,
      guestCount: booking.guest_count,
      checkedInAt: booking.checked_in_at,
      checkedOutAt: booking.checked_out_at,
      createdAt: booking.created_at,
      rooms: rooms.map((r: any) => {
        const room = r.room
        return {
          room: {
            ...room,
            pricePerNight: room.roomType ? parseFloat(room.roomType.basePrice) : 0,
          }
        }
      }),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
