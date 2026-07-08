import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const faqEntries = await query(
      'SELECT * FROM faq_entry WHERE active = true ORDER BY sort_order ASC'
    )
    const response = NextResponse.json(faqEntries)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    return response
  } catch (error: any) {
    console.error('Error fetching FAQ entries:', error)
    return NextResponse.json([])
  }
}
