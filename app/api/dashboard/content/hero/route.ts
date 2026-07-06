import { NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

export async function GET() {
  try {
    const row = await queryOne('SELECT hero_content FROM hotel_settings LIMIT 1')
    if (!row?.hero_content) return NextResponse.json(null)
    return NextResponse.json(typeof row.hero_content === 'string' ? JSON.parse(row.hero_content) : row.hero_content)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const existing = await queryOne('SELECT id FROM hotel_settings LIMIT 1')
    if (existing) {
      await query('UPDATE hotel_settings SET hero_content = $1 WHERE id = $2', [JSON.stringify(body), existing.id])
    } else {
      await query('INSERT INTO hotel_settings (hero_content) VALUES ($1)', [JSON.stringify(body)])
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
