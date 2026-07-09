import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query(
      `SELECT id, slug, name, description, base_price, capacity, bed_config, amenities, images
       FROM room_type ORDER BY base_price ASC`
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, slug: r.slug, name: r.name, description: r.description,
      basePrice: parseFloat(r.base_price), capacity: r.capacity,
      bedConfig: r.bed_config, amenities: r.amenities, images: r.images,
    })))
  } catch (error: any) {
    console.error('Error fetching room types:', error)
    return NextResponse.json([])
  }
}
