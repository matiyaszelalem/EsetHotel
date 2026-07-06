import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const totalRooms = await queryOne<{ count: string }>('SELECT COUNT(*)::text as count FROM room')
    const totalRoomsCount = parseInt(totalRooms?.count || '0')

    const occupiedRooms = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM booking_room br
       JOIN booking b ON b.id = br.booking_id
       WHERE b.status IN ('CONFIRMED', 'CHECKED_IN')
       AND $1::date BETWEEN b.check_in AND b.check_out`, [today]
    )
    const occupiedRoomsCount = parseInt(occupiedRooms?.count || '0')

    const arrivals = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM booking
       WHERE status IN ('CONFIRMED', 'CHECKED_IN')
       AND check_in = $1::date`, [today]
    )

    const departures = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM booking
       WHERE status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
       AND check_out = $1::date`, [today]
    )

    const revenueToday = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0)::text as total FROM payment
       WHERE status = 'COMPLETED'
       AND DATE(created_at) = $1::date`, [today]
    )

    const recentBookings = await query(
      `SELECT b.id, b.reference_id, b.guest_name, b.guest_email,
              b.check_in, b.check_out, b.status, b.total_price, b.payment_method, b.created_at
       FROM booking b
       ORDER BY b.created_at DESC
       LIMIT 10`
    )

    const bookingsWithRooms = await Promise.all(
      recentBookings.map(async (b: any) => {
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
        return {
          id: b.id,
          referenceId: b.reference_id,
          guestName: b.guest_name,
          guestEmail: b.guest_email,
          checkIn: b.check_in,
          checkOut: b.check_out,
          status: b.status,
          totalPrice: parseFloat(b.total_price),
          paymentMethod: b.payment_method,
          createdAt: b.created_at,
          rooms: rooms.map((r: any) => ({ room: r.room })),
        }
      })
    )

    const response = NextResponse.json({
      arrivals: parseInt(arrivals?.count || '0'),
      departures: parseInt(departures?.count || '0'),
      occupancyRate: totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0,
      revenueToday: parseFloat(revenueToday?.total || '0'),
      totalRooms: totalRoomsCount,
      occupiedRooms: occupiedRoomsCount,
      recentBookings: bookingsWithRooms,
    })
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error: any) {
    console.error('Error in dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 })
  }
}
