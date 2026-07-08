import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const summary = await queryOne<{ total_rooms: string; occupied_rooms: string; arrivals: string; departures: string; revenue_today: string }>(
      `WITH today AS (SELECT $1::date AS d)
       SELECT
         (SELECT COUNT(*)::text FROM room) AS total_rooms,
         (SELECT COUNT(*)::text FROM booking_room br
            JOIN booking b ON b.id = br.booking_id
            JOIN today t ON TRUE
            WHERE b.status IN ('CONFIRMED', 'CHECKED_IN')
              AND t.d BETWEEN b.check_in AND b.check_out) AS occupied_rooms,
         (SELECT COUNT(*)::text FROM booking b
            JOIN today t ON TRUE
            WHERE b.status IN ('CONFIRMED', 'CHECKED_IN')
              AND b.check_in = t.d) AS arrivals,
         (SELECT COUNT(*)::text FROM booking b
            JOIN today t ON TRUE
            WHERE b.status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
              AND b.check_out = t.d) AS departures,
         (SELECT COALESCE(SUM(amount), 0)::text FROM payment p
            JOIN today t ON TRUE
            WHERE p.status = 'COMPLETED'
              AND DATE(p.created_at) = t.d) AS revenue_today
      `, [today]
    )

    const totalRoomsCount = parseInt(summary?.total_rooms || '0')
    const occupiedRoomsCount = parseInt(summary?.occupied_rooms || '0')
    const arrivals = parseInt(summary?.arrivals || '0')
    const departures = parseInt(summary?.departures || '0')
    const revenueToday = parseFloat(summary?.revenue_today || '0')

    const recentBookings = await query(
      `WITH recent_bookings AS (
         SELECT id, reference_id, guest_name, guest_email, check_in, check_out,
                status, total_price, payment_method, created_at
         FROM booking
         ORDER BY created_at DESC
         LIMIT 10
       )
       SELECT b.id, b.reference_id, b.guest_name, b.guest_email,
              b.check_in, b.check_out, b.status, b.total_price, b.payment_method, b.created_at,
              COALESCE(json_agg(json_build_object(
                'roomNumber', r.room_number,
                'roomType', json_build_object('name', rt.name)
              )) FILTER (WHERE r.id IS NOT NULL), '[]') AS rooms
       FROM recent_bookings b
       LEFT JOIN booking_room br ON br.booking_id = b.id
       LEFT JOIN room r ON r.id = br.room_id
       LEFT JOIN room_type rt ON rt.id = r.room_type_id
       GROUP BY b.id, b.reference_id, b.guest_name, b.guest_email, b.check_in, b.check_out, b.status, b.total_price, b.payment_method, b.created_at
       ORDER BY b.created_at DESC`
    )

    const bookingsWithRooms = recentBookings.map((b: any) => {
      let rooms = b.rooms ?? []
      if (typeof rooms === 'string') {
        try {
          rooms = JSON.parse(rooms)
        } catch {
          rooms = []
        }
      }
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
        rooms: Array.isArray(rooms) ? rooms.map((r: any) => ({ room: r })) : [],
      }
    })

    const response = NextResponse.json({
      arrivals,
      departures,
      occupancyRate: totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0,
      revenueToday,
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
