import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query(
      `SELECT r.id, r.room_number, r.room_type_id, r.status,
              json_build_object(
                'id', rt.id, 'slug', rt.slug, 'name', rt.name,
                'description', rt.description, 'basePrice', rt.base_price,
                'capacity', rt.capacity, 'bedConfig', rt.bed_config,
                'amenities', rt.amenities, 'images', rt.images
              ) as room_type
       FROM room r
       JOIN room_type rt ON rt.id = r.room_type_id
       ORDER BY r.room_number`
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, roomNumber: r.room_number, roomTypeId: r.room_type_id,
      status: r.status, roomType: r.room_type,
    })))
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { roomNumber, roomTypeId } = body
    const row = await queryOne(
      `INSERT INTO room (room_number, room_type_id, status)
       VALUES ($1, $2, 'AVAILABLE')
       RETURNING id, room_number, room_type_id, status`,
      [roomNumber, roomTypeId]
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
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const body = await req.json()
    const { status } = body
    await query('UPDATE room SET status = $1 WHERE id = $2', [status, id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
