import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const pendingVerifications = await query(
      `SELECT b.id, b.reference_id, b.guest_name, b.guest_email, b.check_in, b.check_out,
              b.status, b.total_price, b.payment_method,
              p.id as payment_id, p.verification_method, p.verification_data, p.amount
       FROM booking b
       JOIN payment p ON p.booking_id = b.id
       WHERE b.payment_method = 'bank_transfer'
         AND p.status = 'PENDING'
         AND b.status IN ('PENDING', 'CONFIRMED')
       ORDER BY b.created_at DESC`
    )

    const arrivals = await query(
      `SELECT b.id, b.reference_id, b.guest_name, b.guest_email, b.guest_phone,
              b.special_requests, b.check_in, b.check_out, b.status, b.total_price, b.payment_method
       FROM booking b
       WHERE b.check_in = $1::date AND b.status IN ('CONFIRMED')
       ORDER BY b.guest_name`, [today]
    )

    const departures = await query(
      `SELECT b.id, b.reference_id, b.guest_name, b.guest_email, b.guest_phone,
              b.special_requests, b.check_in, b.check_out, b.status, b.total_price, b.payment_method
       FROM booking b
       WHERE b.check_out = $1::date AND b.status IN ('CHECKED_IN', 'CONFIRMED')
       ORDER BY b.guest_name`, [today]
    )

    const enrich = async (rows: any[]) => Promise.all(rows.map(async (b: any) => {
      const rooms = await query(
        `SELECT json_build_object(
           'roomNumber', r.room_number,
           'roomType', json_build_object('name', rt.name)
         ) as room
         FROM booking_room br
         JOIN room r ON r.id = br.room_id
         JOIN room_type rt ON rt.id = r.room_type_id
         WHERE br.booking_id = $1`, [b.id]
      )
      const payment = (await query('SELECT status FROM payment WHERE booking_id = $1 LIMIT 1', [b.id]))[0] || null
      return {
        id: b.id, referenceId: b.reference_id,
        guestName: b.guest_name, guestEmail: b.guest_email,
        guestPhone: b.guest_phone, specialRequests: b.special_requests,
        checkIn: b.check_in, checkOut: b.check_out,
        status: b.status, totalPrice: parseFloat(b.total_price),
        paymentMethod: b.payment_method,
        payment, rooms: rooms.map((r: any) => ({ room: r.room })),
      }
    }))

    return NextResponse.json({
      arrivals: await enrich(arrivals),
      departures: await enrich(departures),
      pendingVerifications: pendingVerifications.map((b: any) => ({
        id: b.id, referenceId: b.reference_id,
        guestName: b.guest_name, guestEmail: b.guest_email,
        checkIn: b.check_in, checkOut: b.check_out,
        status: b.status, totalPrice: parseFloat(b.total_price),
        paymentMethod: b.payment_method,
        paymentId: b.payment_id,
        verificationMethod: b.verification_method,
        verificationData: b.verification_data,
        amount: parseFloat(b.amount),
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
