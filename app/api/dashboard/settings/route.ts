import { NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export async function GET() {
  try {
    const settings = await queryOne(
      `SELECT id, hotel_name, address, contact_phone, contact_email,
              currency, checkin_time, checkout_time, etb_conversion_rate,
              hero_content, tax_rate
       FROM hotel_settings LIMIT 1`
    )
    if (!settings) return NextResponse.json({})
    return NextResponse.json({
      id: settings.id,
      hotelName: settings.hotel_name,
      address: settings.address,
      contactEmail: settings.contact_email,
      contactPhone: settings.contact_phone,
      currency: settings.currency,
      checkinTime: settings.checkin_time,
      checkoutTime: settings.checkout_time,
      etbConversionRate: settings.etb_conversion_rate,
      heroContent: settings.hero_content,
      taxRate: settings.tax_rate || 0.15,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const existing = await queryOne('SELECT id FROM hotel_settings LIMIT 1')

    const fields: string[] = []
    const params: any[] = []
    let idx = 1

    const map: Record<string, string> = {
      hotelName: 'hotel_name', address: 'address',
      contactPhone: 'contact_phone', contactEmail: 'contact_email',
      currency: 'currency', checkinTime: 'checkin_time',
      checkoutTime: 'checkout_time', etbConversionRate: 'etb_conversion_rate',
      heroContent: 'hero_content',
      taxRate: 'tax_rate',
    }

    for (const [key, col] of Object.entries(map)) {
      if (body[key] !== undefined) {
        fields.push(`${col} = $${idx++}`)
        params.push(body[key])
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    if (existing) {
      params.push(existing.id)
      await query(`UPDATE hotel_settings SET ${fields.join(', ')} WHERE id = $${idx}`, params)
    } else {
      const cols = fields.map(f => f.split('=')[0].trim())
      const vals = fields.map((_, i) => `$${i + 1}`)
      await query(`INSERT INTO hotel_settings (${cols.join(', ')}) VALUES (${vals.join(', ')})`, params)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
