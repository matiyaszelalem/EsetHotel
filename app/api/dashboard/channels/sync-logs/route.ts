import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query(
      `SELECT sl.id, sl.channel_id, sl.status, sl.details as message, sl.created_at, c.name as channel_name
       FROM channel_sync_log sl
       JOIN channel c ON c.id = sl.channel_id
       ORDER BY sl.created_at DESC
       LIMIT 50`
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, channelId: r.channel_id, status: r.status,
      message: r.message, createdAt: r.created_at, channelName: r.channel_name,
    })))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
