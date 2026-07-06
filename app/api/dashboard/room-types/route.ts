import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query(
      `SELECT id, slug, name, description, base_price, capacity, bed_config, amenities, images, ical_token
       FROM room_type ORDER BY name`
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, slug: r.slug, name: r.name, description: r.description,
      basePrice: parseFloat(r.base_price), capacity: r.capacity,
      bedConfig: r.bed_config, amenities: r.amenities, images: r.images,
      icalToken: r.ical_token,
    })))
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch room types' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, slug, description, basePrice, capacity, bedConfig, amenities } = body
    const row = await queryOne(
      `INSERT INTO room_type (name, slug, description, base_price, capacity, bed_config, amenities)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, slug, name, description, base_price, capacity, bed_config, amenities, images, ical_token`,
      [name, slug || name.toLowerCase().replace(/\s+/g, '-'), description, basePrice, capacity, bedConfig, amenities || '[]']
    )
    return NextResponse.json(row)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    if (action === 'rotate-ical-token') {
      const row = await queryOne<{ ical_token: string }>(
        `UPDATE room_type SET ical_token = gen_random_uuid() WHERE id = $1
         RETURNING ical_token`,
        [id]
      )
      if (!row) return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
      return NextResponse.json({ icalToken: row.ical_token })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await query('DELETE FROM room_type WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
