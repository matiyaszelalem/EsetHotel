import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, subtotal } = body

    if (!code || subtotal === undefined) {
      return NextResponse.json({ success: false, error: 'Missing code or subtotal' }, { status: 400 })
    }

    const promo = await queryOne<{
      id: string
      code: string
      active: boolean
      discount_type: string
      value: number
      valid_from: string
      valid_to: string
      usage_limit: number | null
      used_count: number
    }>('SELECT * FROM promo_code WHERE code = $1', [code.toUpperCase()])

    if (!promo) {
      return NextResponse.json({ success: false, error: 'Invalid promo code' }, { status: 404 })
    }

    if (!promo.active) {
      return NextResponse.json({ success: false, error: 'This promo code is no longer active' }, { status: 400 })
    }

    const now = new Date()
    const validFrom = new Date(promo.valid_from)
    const validTo = new Date(promo.valid_to)

    if (now < validFrom || now > validTo) {
      return NextResponse.json({ success: false, error: 'This promo code has expired' }, { status: 400 })
    }

    if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) {
      return NextResponse.json({ success: false, error: 'This promo code usage limit has been reached' }, { status: 400 })
    }

    let discountAmount = 0
    if (promo.discount_type === 'PERCENTAGE') {
      discountAmount = parseFloat(((promo.value / 100) * subtotal).toFixed(2))
    } else if (promo.discount_type === 'FIXED') {
      discountAmount = Math.min(promo.value, subtotal)
    }

    return NextResponse.json({
      success: true,
      promoCodeId: promo.id,
      code: promo.code,
      discountType: promo.discount_type,
      value: promo.value,
      discountAmount,
    })
  } catch (error: any) {
    console.error('Error validating promo code:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
