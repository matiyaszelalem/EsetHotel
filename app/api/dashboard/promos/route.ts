import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query(
      `SELECT id, code,
              CASE WHEN discount_percent IS NOT NULL THEN 'PERCENTAGE' ELSE 'FIXED' END as discount_type,
              COALESCE(discount_percent::text, discount_amount::text) as value,
              max_uses as usage_limit,
              COALESCE(used_count, 0) as used_count,
              is_active as active,
              valid_from, valid_to, room_type_id, created_at
       FROM promo_code ORDER BY created_at DESC`
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, code: r.code,
      discountType: r.discount_type, value: r.value ? parseFloat(r.value) : null,
      validFrom: r.valid_from, validTo: r.valid_to,
      usageLimit: r.usage_limit, usedCount: parseInt(r.used_count) || 0,
      active: r.active, roomTypeId: r.room_type_id,
      createdAt: r.created_at,
    })))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const isPercent = body.discountType === 'PERCENTAGE'
    const row = await queryOne(
      `INSERT INTO promo_code (code, description, discount_percent, discount_amount,
        max_uses, valid_from, valid_to, is_active, room_type_id)
       VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9)
       RETURNING *`,
      [body.code, body.description || null,
       isPercent ? body.value : null, isPercent ? null : body.value,
       body.usageLimit || null, body.validFrom || null, body.validTo || null,
       body.active ?? true, body.roomTypeId || null]
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

    if (body.code !== undefined) { sets.push(`code = $${idx++}`); params.push(body.code) }
    if (body.discountType !== undefined && body.value !== undefined) {
      if (body.discountType === 'PERCENTAGE') {
        sets.push(`discount_percent = $${idx++}`); params.push(body.value)
        sets.push(`discount_amount = NULL`)
      } else {
        sets.push(`discount_amount = $${idx++}`); params.push(body.value)
        sets.push(`discount_percent = NULL`)
      }
    }
    if (body.usageLimit !== undefined) { sets.push(`max_uses = $${idx++}`); params.push(body.usageLimit) }
    if (body.active !== undefined) { sets.push(`is_active = $${idx++}`); params.push(body.active) }
    if (body.validFrom !== undefined) { sets.push(`valid_from = $${idx++}::date`); params.push(body.validFrom) }
    if (body.validTo !== undefined) { sets.push(`valid_to = $${idx++}::date`); params.push(body.validTo) }
    if (body.roomTypeId !== undefined) { sets.push(`room_type_id = $${idx++}`); params.push(body.roomTypeId) }
    if (body.description !== undefined) { sets.push(`description = $${idx++}`); params.push(body.description) }

    if (sets.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
    params.push(id)
    await query(`UPDATE promo_code SET ${sets.join(', ')} WHERE id = $${idx}`, params)
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
    await query('DELETE FROM promo_code WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
