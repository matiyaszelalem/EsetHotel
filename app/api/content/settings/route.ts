import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function GET() {
  try {
    const settings = await queryOne<{
      hotel_name: string
      address: string | null
      contact_email: string | null
      contact_phone: string | null
      currency: string
      checkin_time: string
      checkout_time: string
    }>('SELECT * FROM hotel_settings LIMIT 1')

    if (!settings) {
      return NextResponse.json(null)
    }

    const response = NextResponse.json({
      hotelName: settings.hotel_name,
      address: settings.address,
      contactEmail: settings.contact_email,
      contactPhone: settings.contact_phone,
      currency: settings.currency,
      checkinTime: settings.checkin_time,
      checkoutTime: settings.checkout_time,
    })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    return response
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(null)
  }
}
