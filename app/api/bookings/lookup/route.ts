import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const referenceId = searchParams.get('reference')

    if (!referenceId) {
      return NextResponse.json({ error: 'Reference ID is required' }, { status: 400 })
    }

    const booking = await queryOne<{
      id: string
      reference_id: string
      user_id: string | null
      guest_name: string
      guest_email: string
      guest_phone: string | null
      special_requests: string | null
      check_in: string
      check_out: string
      guests: number
      status: string
      payment_method: string
      total_price: number
      currency: string
      promo_code_id: string | null
      source: string
      created_at: string
      updated_at: string
    }>('SELECT * FROM booking WHERE reference_id = $1', [referenceId])

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const bookingRooms = await query<{
      booking_id: string
      room_id: string
      price_per_night: number
      room_number: string
      room_type_id: string
      room_type_name: string
      room_type_slug: string
    }>(
      `SELECT br.*, r.room_number, r.room_type_id, rt.name as room_type_name, rt.slug as room_type_slug
       FROM booking_room br
       JOIN room r ON r.id = br.room_id
       JOIN room_type rt ON rt.id = r.room_type_id
       WHERE br.booking_id = $1`,
      [booking.id]
    )

    const payment = await queryOne(
      'SELECT * FROM payment WHERE booking_id = $1', [booking.id]
    )

    let promoCode = null
    if (booking.promo_code_id) {
      promoCode = await queryOne(
        'SELECT * FROM promo_code WHERE id = $1', [booking.promo_code_id]
      )
    }

    const result = {
      id: booking.id,
      referenceId: booking.reference_id,
      userId: booking.user_id,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      guestPhone: booking.guest_phone,
      specialRequests: booking.special_requests,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      guests: booking.guests,
      status: booking.status,
      paymentMethod: booking.payment_method,
      totalPrice: booking.total_price,
      currency: booking.currency,
      promoCodeId: booking.promo_code_id,
      source: booking.source,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      rooms: bookingRooms.map(br => ({
        roomId: br.room_id,
        pricePerNight: br.price_per_night,
        room: {
          roomNumber: br.room_number,
          roomTypeId: br.room_type_id,
          roomType: {
            name: br.room_type_name,
            slug: br.room_type_slug,
          },
        },
      })),
      payment: payment || null,
      promoCode: promoCode || null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error looking up booking:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
