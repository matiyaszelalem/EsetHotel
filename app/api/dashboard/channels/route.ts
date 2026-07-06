import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query(
      `SELECT c.*,
        (SELECT COUNT(*)::int FROM channel_mapping cm WHERE cm.channel_id = c.id) as mapping_count,
        (SELECT COUNT(*)::int FROM channel_sync_log sl WHERE sl.channel_id = c.id) as sync_log_count
       FROM channel c ORDER BY c.name`
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, name: r.name, slug: r.slug,
      status: r.status,
      apiKey: r.api_key ? '••••' + r.api_key.slice(-4) : null,
      apiSecret: r.api_secret ? '••••' + r.api_secret.slice(-4) : null,
      lastSyncAt: r.last_sync_at, createdAt: r.created_at,
      _count: { mappings: r.mapping_count || 0, syncLogs: r.sync_log_count || 0 },
    })))
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
    const sets: string[] = []
    const params: any[] = []
    let idx = 1
    if (body.apiKey) { sets.push(`api_key = $${idx++}`); params.push(body.apiKey) }
    if (body.apiSecret) { sets.push(`api_secret = $${idx++}`); params.push(body.apiSecret) }
    if (body.status) { sets.push(`status = $${idx++}`); params.push(body.status) }
    if (sets.length > 0) {
      params.push(id)
      await query(`UPDATE channel SET ${sets.join(', ')} WHERE id = $${idx}`, params)
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
