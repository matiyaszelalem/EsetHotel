import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { queryOne, transaction } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', { apiVersion: '2026-05-27.dahlia' })
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata || {}

    if (meta.referenceId) {
      const existingBooking = await queryOne<{ id: string }>(
        'SELECT id FROM booking WHERE reference_id = $1', [meta.referenceId]
      )

      if (existingBooking) {
        await transaction(async (tx) => {
          await tx.execute(
            `UPDATE booking SET status = 'CONFIRMED', payment_method = 'stripe', total_price = $1
             WHERE id = $2 AND status = 'PENDING'`,
            [(session.amount_total || 0) / 100, existingBooking.id]
          )
          await tx.execute(
            'INSERT INTO payment (booking_id, stripe_session_id, amount, status) VALUES ($1, $2, $3, $4)',
            [existingBooking.id, session.id, (session.amount_total || 0) / 100, 'COMPLETED']
          )
        })
      } else {
        await transaction(async (tx) => {
          const roomType = await tx.queryOne<{ id: string }>(
            'SELECT id FROM room_type WHERE slug = $1', [meta.roomSlug]
          )
          if (!roomType) throw new Error('Room type not found')

          const bookedRoomIds = await tx.query<{ room_id: string }>(
            `SELECT DISTINCT br.room_id FROM booking_room br
             JOIN booking b ON b.id = br.booking_id
             JOIN room r ON r.id = br.room_id
             WHERE b.status NOT IN ('CANCELLED')
             AND r.room_type_id = $1
             AND b.check_in < $3
             AND b.check_out > $2`,
            [roomType.id, meta.checkIn, meta.checkOut]
          )
          const bookedIds = bookedRoomIds.map(br => br.room_id)
          const availableRooms = bookedIds.length > 0
            ? await tx.query<{ id: string; room_number: string }>(
                `SELECT id, room_number FROM room
                 WHERE room_type_id = $1 AND status != 'MAINTENANCE' AND id != ALL($2)`,
                [roomType.id, bookedIds]
              )
            : await tx.query<{ id: string; room_number: string }>(
                `SELECT id, room_number FROM room
                 WHERE room_type_id = $1 AND status != 'MAINTENANCE'`,
                [roomType.id]
              )

          if (availableRooms.length === 0) throw new Error('No rooms available')

          const roomIds = [availableRooms[0].id]
          const locked = await tx.query<{ id: string }>(
            `SELECT id FROM room
             WHERE id = ANY($1) AND status = 'AVAILABLE'
             FOR UPDATE SKIP LOCKED`,
            [roomIds]
          )
          if (locked.length !== roomIds.length) throw new Error('Room locked by another booking')

          const b = await tx.queryOne<{ id: string; reference_id: string }>(
            `INSERT INTO booking (reference_id, guest_name, guest_email, guest_phone,
              special_requests, check_in, check_out, guests, status, payment_method,
              total_price, applied_tax_rate, source)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CONFIRMED', 'stripe', $9, $10, 'DIRECT')
             RETURNING id, reference_id`,
            [
              meta.referenceId, meta.guestName, meta.guestEmail,
              meta.guestPhone || null, meta.specialRequests || null,
              meta.checkIn, meta.checkOut, parseInt(meta.guests || '1'),
              ((session.amount_total || 0) / 100), parseFloat(meta.taxRate || '0.15'),
            ]
          )

          await tx.execute(
            'INSERT INTO booking_room (booking_id, room_id, price_per_night) VALUES ($1, $2, $3)',
            [b!.id, availableRooms[0].id, parseFloat(meta.basePrice || '0')]
          )

          await tx.execute(
            "UPDATE room SET status = 'RESERVED' WHERE id = $1",
            [availableRooms[0].id]
          )

          await tx.execute(
            'INSERT INTO payment (booking_id, stripe_session_id, amount, status) VALUES ($1, $2, $3, $4)',
            [b!.id, session.id, (session.amount_total || 0) / 100, 'COMPLETED']
          )
        })
      }

      try {
        const { createNotification } = await import('@/lib/notifications')
        const amount = ((session.amount_total || 0) / 100).toFixed(2)
        await createNotification(
          'PAYMENT_RECEIVED',
          'Payment Confirmed',
          `$${amount} received — ref: ${meta.referenceId}`,
          meta.referenceId
        )
      } catch {}
    }
  }

  return NextResponse.json({ received: true })
}
