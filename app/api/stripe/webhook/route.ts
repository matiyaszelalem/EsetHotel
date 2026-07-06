import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { query, transaction } from '@/lib/db'

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
    const bookingId = session.metadata?.bookingId

    if (bookingId) {
      await transaction(async (tx) => {
        await tx.execute(
          'UPDATE booking SET status = $1 WHERE id = $2',
          ['CONFIRMED', bookingId]
        )
        await tx.execute(
          'INSERT INTO payment (booking_id, stripe_session_id, amount, status) VALUES ($1, $2, $3, $4)',
          [bookingId, session.id, (session.amount_total || 0) / 100, 'COMPLETED']
        )
      })
      console.log(`Booking ${bookingId} confirmed via Stripe webhook!`)

      try {
        const { createNotification } = await import('@/lib/notifications')
        const amount = ((session.amount_total || 0) / 100).toFixed(2)
        await createNotification(
          'PAYMENT_RECEIVED',
          'Payment Confirmed',
          `$${amount} received for booking ${bookingId}`,
          bookingId
        )
      } catch {}
    }
  }

  return NextResponse.json({ received: true })
}
