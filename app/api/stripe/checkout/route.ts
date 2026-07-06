import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { queryOne } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', { apiVersion: '2026-05-27.dahlia' })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { roomSlug, checkIn, checkOut, guests, guestName, guestEmail, guestPhone, specialRequests } = body

    const basePrice = 150
    const nights = 5
    const totalAmount = basePrice * nights * 1.15

    const booking = await queryOne<{ id: string; reference_id: string }>(
      `INSERT INTO booking (reference_id, guest_name, guest_email, guest_phone,
        special_requests, check_in, check_out, guests, status, payment_method, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', 'STRIPE', $9)
       RETURNING id, reference_id`,
      [
        `ESET-${Math.floor(100000 + Math.random() * 900000)}`,
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        new Date(checkIn).toISOString(),
        new Date(checkOut).toISOString(),
        parseInt(guests),
        totalAmount,
      ]
    )

    const mockReferenceId = booking!.reference_id

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Eset Hotel - ${roomSlug}`,
              description: `${nights} nights from ${checkIn} to ${checkOut}`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/confirmation/${mockReferenceId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/checkout?room=${roomSlug}`,
      metadata: {
        bookingId: booking!.id,
      },
    })

    return NextResponse.json({ url: session.url || `/booking/confirmation/${mockReferenceId}` })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
