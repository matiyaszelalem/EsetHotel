import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const REFERENCE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateReference(): string {
  let ref = 'ESET-'
  for (let i = 0; i < 8; i++) {
    ref += REFERENCE_CHARS[Math.floor(Math.random() * REFERENCE_CHARS.length)]
  }
  return ref
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let sql = `SELECT b.id, b.reference_id, b.guest_name, b.guest_email, b.guest_phone,
                      b.check_in, b.check_out, b.status, b.total_price, b.payment_method,
                      b.source, b.created_at,
                      (SELECT row_to_json(p) FROM (SELECT status FROM payment WHERE booking_id = b.id LIMIT 1) p) as payment
               FROM booking b WHERE 1=1`
    const params: any[] = []
    let idx = 1

    if (status && status !== 'ALL') {
      sql += ` AND b.status = $${idx++}`
      params.push(status)
    }
    if (search) {
      sql += ` AND (b.guest_name ILIKE $${idx} OR b.guest_email ILIKE $${idx} OR b.reference_id ILIKE $${idx})`
      params.push(`%${search}%`)
      idx++
    }
    if (startDate) {
      sql += ` AND b.check_in >= $${idx++}::date`
      params.push(startDate)
    }
    if (endDate) {
      sql += ` AND b.check_out <= $${idx++}::date`
      params.push(endDate)
    }
    sql += ' ORDER BY b.created_at DESC'

    const rows = await query(sql, params)

    const bookings = await Promise.all(rows.map(async (b: any) => {
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
        id: b.id, referenceId: b.reference_id,
        guestName: b.guest_name, guestEmail: b.guest_email,
        guestPhone: b.guest_phone,
        checkIn: b.check_in, checkOut: b.check_out,
        status: b.status, totalPrice: parseFloat(b.total_price),
        paymentMethod: b.payment_method, source: b.source,
        createdAt: b.created_at,
        payment: b.payment,
        rooms: rooms.map((r: any) => ({ room: r.room })),
      }
    }))

    return NextResponse.json(bookings)
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { guestName, guestEmail, guestPhone, specialRequests, checkIn, checkOut, guests, roomTypeId, paymentMethod, paymentStatus, source } = body

    const referenceId = generateReference()

    const available = await queryOne(
      `SELECT r.id FROM room r
       WHERE r.room_type_id = $1 AND r.status = 'AVAILABLE'
       AND r.id NOT IN (
         SELECT br.room_id FROM booking_room br
         JOIN booking b ON b.id = br.booking_id
         WHERE b.status IN ('CONFIRMED', 'CHECKED_IN')
         AND ($2::date, $3::date) OVERLAPS (b.check_in, b.check_out)
       )
       LIMIT 1`, [roomTypeId, checkIn, checkOut]
    )

    if (!available) {
      return NextResponse.json({ error: 'No rooms available for the selected dates' }, { status: 400 })
    }

    const nightCount = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))

    const rt = await queryOne<{ base_price: string }>('SELECT base_price FROM room_type WHERE id = $1', [roomTypeId])
    const totalPrice = parseFloat(rt?.base_price || '0') * nightCount

    const booking = await queryOne<{ id: string; reference_id: string; guest_name: string; check_in: string; check_out: string; total_price: string }>(
      `INSERT INTO booking (reference_id, guest_name, guest_email, guest_phone, check_in, check_out,
        status, total_price, payment_method, source, special_requests, guests)
       VALUES ($1, $2, $3, $4, $5::date, $6::date, 'CONFIRMED', $7, $8, $9, $10, $11)
       RETURNING id, reference_id, guest_name, check_in, check_out, total_price`,
      [referenceId, guestName, guestEmail, guestPhone || null, checkIn, checkOut, totalPrice, paymentMethod, source || 'WALK_IN', specialRequests || null, parseInt(guests || '1')]
    )

    await query(
      'INSERT INTO booking_room (booking_id, room_id, price_per_night) VALUES ($1, $2, $3)',
      [booking!.id, available.id, parseFloat(rt?.base_price || '0')]
    )

    await query(
      `INSERT INTO payment (booking_id, amount, status) VALUES ($1, $2, $3)`,
      [booking!.id, totalPrice, paymentStatus || 'PENDING']
    )

    try {
      const { createNotification } = await import('@/lib/notifications')
      await createNotification(
        'BOOKING_NEW',
        'Walk-in Booking',
        `${booking!.guest_name} — Room ${available.room_number} (${booking!.reference_id})`,
        booking!.reference_id
      )
    } catch {}

    return NextResponse.json(booking!)
  } catch (error: any) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body = await req.json()
    const { status } = body

    const updates: string[] = []
    const params: any[] = []
    let idx = 1

    if (status) { updates.push(`status = $${idx++}`); params.push(status) }

    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    params.push(id)
    await query(`UPDATE booking SET ${updates.join(', ')} WHERE id = $${idx}`, params)

    if (body.paymentStatus) {
      await query(`UPDATE payment SET status = $1 WHERE booking_id = $2`, [body.paymentStatus, id])
    }

    if (status === 'CHECKED_OUT' || status === 'CANCELLED' || status === 'NO_SHOW') {
      await query(
        `UPDATE room SET status = 'AVAILABLE' WHERE id IN (
           SELECT room_id FROM booking_room WHERE booking_id = $1
        )`, [id]
      )
    }

    if (status === 'CHECKED_IN') {
      await query(
        `UPDATE room r SET status = 'OCCUPIED' FROM booking_room br
         WHERE br.booking_id = $1 AND br.room_id = r.id`, [id]
      )
    }

    if (['CHECKED_IN', 'CHECKED_OUT', 'NO_SHOW', 'CANCELLED'].includes(status)) {
      const user = await getCurrentUser()
      const booking = await queryOne<{ id: string; guest_name: string; guest_email: string; reference_id: string }>(
        'SELECT id, guest_name, guest_email, reference_id FROM booking WHERE id = $1', [id]
      )
      if (user && booking) {
        if (status === 'CANCELLED' || status === 'NO_SHOW') {
          try {
            const { sendCancellationEmail } = await import('@/lib/email')
            void sendCancellationEmail(booking)
          } catch {}
        }
        await query(
          `INSERT INTO "AuditLog" (action, entity, "entityId", details, "userId")
           VALUES ($1, $2, $3, $4, $5)`,
          [status, 'Booking', id, `${booking.guest_name} (${booking.reference_id}) marked as ${status}`, user.id]
        )

        try {
          const { createNotification } = await import('@/lib/notifications')
          const typeMap: Record<string, { type: string; title: string }> = {
            CHECKED_IN: { type: 'BOOKING_CHECK_IN', title: 'Guest Checked In' },
            CHECKED_OUT: { type: 'BOOKING_CHECK_OUT', title: 'Guest Checked Out' },
            CANCELLED: { type: 'BOOKING_CANCELLED', title: 'Booking Cancelled' },
            NO_SHOW: { type: 'BOOKING_CANCELLED', title: 'Guest No-Show' },
          }
          const n = typeMap[status]
          if (n) await createNotification(n.type, n.title, `${booking.guest_name} (${booking.reference_id})`, booking.reference_id)
        } catch {}
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
