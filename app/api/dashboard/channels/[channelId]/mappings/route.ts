import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET(req: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { channelId } = await params
    const rows = await query(
      `SELECT cm.id, cm.channel_id, cm.room_type_id, cm.external_room_code,
              cm.rate_code, cm.sync_enabled, cm.created_at, cm.updated_at,
              rt.name as room_type_name
       FROM channel_mapping cm
       JOIN room_type rt ON rt.id = cm.room_type_id
       WHERE cm.channel_id = $1
       ORDER BY rt.name`, [channelId]
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, channelId: r.channel_id, roomTypeId: r.room_type_id,
      externalRoomCode: r.external_room_code, rateCode: r.rate_code || '',
      syncEnabled: r.sync_enabled, createdAt: r.created_at, updatedAt: r.updated_at,
      roomTypeName: r.room_type_name,
    })))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { channelId } = await params
    const body = await req.json()
    const row = await queryOne(
      `INSERT INTO channel_mapping (channel_id, room_type_id, external_room_code, rate_code, sync_enabled)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [channelId, body.roomTypeId, body.externalRoomCode || '', body.rateCode || '', body.syncEnabled ?? true]
    )
    return NextResponse.json(row)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { searchParams } = new URL(req.url)
    const mappingId = searchParams.get('mappingId')
    if (!mappingId) return NextResponse.json({ error: 'Missing mappingId' }, { status: 400 })
    await query('DELETE FROM channel_mapping WHERE id = $1', [mappingId])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { searchParams } = new URL(req.url)
    const mappingId = searchParams.get('mappingId')
    if (!mappingId) return NextResponse.json({ error: 'Missing mappingId' }, { status: 400 })
    const body = await req.json()
    if (body.syncEnabled !== undefined) {
      await query('UPDATE channel_mapping SET sync_enabled = $1 WHERE id = $2', [body.syncEnabled, mappingId])
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
