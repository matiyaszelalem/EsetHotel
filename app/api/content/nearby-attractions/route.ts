import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const attractions = await query(
      'SELECT name, distance FROM nearby_attraction WHERE active = true ORDER BY sort_order ASC'
    )
    return NextResponse.json(attractions)
  } catch (error: any) {
    console.error('Error fetching nearby attractions:', error)
    return NextResponse.json([])
  }
}
