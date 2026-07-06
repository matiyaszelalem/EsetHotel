import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query('SELECT * FROM testimonial ORDER BY sort_order ASC, created_at DESC')
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, guestName: r.name, rating: r.rating,
      comment: r.content, approved: r.is_featured,
      sortOrder: r.sort_order, avatarUrl: r.avatar_url,
      createdAt: r.created_at,
    })))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const row = await queryOne(
      `INSERT INTO testimonial (name, content, rating, is_featured, role, avatar_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [body.guestName, body.comment, body.rating || 5,
       body.approved ?? true, body.role || null,
       body.avatarUrl || null, body.sortOrder || 0]
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
    const sets: string[] = []
    const params: any[] = []
    let idx = 1
    const map: Record<string, string> = {
      guestName: 'name', comment: 'content', rating: 'rating',
      approved: 'is_featured', sortOrder: 'sort_order',
      role: 'role', avatarUrl: 'avatar_url',
    }
    for (const [key, col] of Object.entries(map)) {
      if (body[key] !== undefined) {
        sets.push(`${col} = $${idx++}`)
        params.push(body[key])
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
    params.push(id)
    await query(`UPDATE testimonial SET ${sets.join(', ')} WHERE id = $${idx}`, params)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await query('DELETE FROM testimonial WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
