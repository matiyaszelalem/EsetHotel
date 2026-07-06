import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const amenities = await query(
      'SELECT * FROM amenity WHERE active = true ORDER BY sort_order ASC'
    )
    return NextResponse.json(amenities)
  } catch (error: any) {
    console.error('Error fetching amenities:', error)
    return NextResponse.json([])
  }
}
