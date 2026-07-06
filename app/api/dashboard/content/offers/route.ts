import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query(
      `SELECT so.*, pc.code as promo_code_code
       FROM special_offer so
       LEFT JOIN promo_code pc ON pc.id = so.promo_code_id
       ORDER BY so.created_at DESC`
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, title: r.title, description: r.description,
      imageUrl: r.image_url, validFrom: r.valid_from, validTo: r.valid_to,
      active: r.is_active,
      promoCodeId: r.promo_code_id,
      promoCode: r.promo_code_id ? { code: r.promo_code_code } : null,
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
      `INSERT INTO special_offer (title, description, image_url, valid_from, valid_to, is_active, promo_code_id)
       VALUES ($1, $2, $3, $4::date, $5::date, $6, $7)
       RETURNING *`,
      [body.title, body.description, body.imageUrl || null,
       body.validFrom, body.validTo, body.active ?? true, body.promoCodeId || null]
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
      title: 'title', description: 'description', imageUrl: 'image_url',
      validFrom: 'valid_from', validTo: 'valid_to',
      active: 'is_active', promoCodeId: 'promo_code_id',
    }
    for (const [key, col] of Object.entries(map)) {
      if (body[key] !== undefined) {
        sets.push(`${col} = $${idx++}`)
        params.push(body[key])
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
    params.push(id)
    await query(`UPDATE special_offer SET ${sets.join(', ')} WHERE id = $${idx}`, params)
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
    await query('DELETE FROM special_offer WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
