import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const roomTypes = await query(
      'SELECT * FROM room_type ORDER BY base_price ASC'
    )
    return NextResponse.json(roomTypes)
  } catch (error: any) {
    console.error('Error fetching room types:', error)
    return NextResponse.json([])
  }
}
