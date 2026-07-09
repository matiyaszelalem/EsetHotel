import crypto from 'crypto'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { queryOne } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', { apiVersion: '2026-05-27.dahlia' })

function generateReferenceId(): string {
  const part1 = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase()
  const part2 = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase()
  return `ESH-${part1}-${part2}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { roomSlug, checkIn, checkOut, guests, guestName, guestEmail, guestPhone, specialRequests, promoCode } = body

    if (!roomSlug || !checkIn || !checkOut || !guestName || !guestEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000)
    if (nights < 1) {
      return NextResponse.json({ error: 'Minimum stay is 1 night' }, { status: 400 })
    }

    const settings = await queryOne<{ tax_rate: number }>(
      'SELECT tax_rate FROM hotel_settings LIMIT 1'
    )
    const taxRate = Number(settings?.tax_rate ?? 0.15)

    const roomType = await queryOne<{
      id: string; name: string; slug: string; base_price: number; capacity: number
    }>(
      'SELECT id, name, slug, base_price, capacity FROM room_type WHERE slug = $1',
      [roomSlug]
    )

    if (!roomType) {
      return NextResponse.json({ error: 'Room category not found' }, { status: 404 })
    }

    const guestCount = parseInt(guests) || 1
    if (guestCount > roomType.capacity) {
      return NextResponse.json({ error: `Room capacity exceeded (max ${roomType.capacity} guests)` }, { status: 400 })
    }

    let subtotal = nights * roomType.base_price
    let appliedPromoCode: string | null = null

    if (promoCode) {
      const promo = await queryOne<{
        id: string; discount_type: string; value: number
      }>(
        `SELECT id, discount_type, value FROM promo_code
         WHERE code = $1 AND active = true
           AND (usage_limit IS NULL OR used_count < usage_limit)
           AND NOW() BETWEEN valid_from AND valid_to`,
        [promoCode]
      )
      if (promo) {
        if (promo.discount_type === 'PERCENTAGE') {
          subtotal = parseFloat((subtotal * (1 - promo.value / 100)).toFixed(2))
        } else if (promo.discount_type === 'FIXED') {
          subtotal = Math.max(0, subtotal - promo.value)
        }
        appliedPromoCode = promoCode
      }
    }

    const taxes = subtotal * taxRate
    const totalPrice = parseFloat((subtotal + taxes).toFixed(2))
    const referenceId = generateReferenceId()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Eset Hotel - ${roomType.name}`,
              description: `${nights} night${nights > 1 ? 's' : ''} from ${checkInDate.toLocaleDateString()} to ${checkOutDate.toLocaleDateString()}`,
            },
            unit_amount: Math.round(totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/confirmation/${referenceId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/booking/checkout?room=${roomSlug}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`,
      metadata: {
        referenceId,
        roomSlug,
        checkIn,
        checkOut,
        guests: String(guestCount),
        guestName,
        guestEmail,
        guestPhone: guestPhone || '',
        specialRequests: specialRequests || '',
        totalPrice: String(totalPrice),
        taxRate: String(taxRate),
        nights: String(nights),
        basePrice: String(roomType.base_price),
        promoCode: appliedPromoCode || '',
      },
    })

    return NextResponse.json({ url: session.url || `/booking/confirmation/${referenceId}`, referenceId })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
