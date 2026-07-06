import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { hash } from 'bcryptjs'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.created_at as "createdAt", u.updated_at as "updatedAt",
              (SELECT COUNT(*)::int FROM booking WHERE booking.guest_email = u.email) as booking_count
       FROM "user" u ORDER BY u.created_at DESC`
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, name: r.name, email: r.email, role: r.role,
      phone: r.phone, createdAt: r.createdAt, updatedAt: r.updatedAt,
      _count: { bookings: r.booking_count },
    })))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, role, phone } = body

    const existing = await queryOne('SELECT id FROM "user" WHERE email = $1', [email])
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 })

    const passwordHash = await hash(password, 10)
    const user = await queryOne(
      `INSERT INTO "user" (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, created_at, updated_at`,
      [name, email, passwordHash, role || 'STAFF', phone || null]
    )
    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const targetUser = await queryOne<{ role: string }>('SELECT role FROM "user" WHERE id = $1', [id])
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (targetUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can modify other super admins' }, { status: 403 })
    }

    const body = await req.json()
    const updates: string[] = []
    const params: any[] = []
    let idx = 1

    if (body.name) { updates.push(`name = $${idx++}`); params.push(body.name) }
    if (body.email) { updates.push(`email = $${idx++}`); params.push(body.email) }
    if (body.role) { updates.push(`role = $${idx++}`); params.push(body.role) }
    if (body.phone !== undefined) { updates.push(`phone = $${idx++}`); params.push(body.phone) }
    if (body.password) {
      const pwHash = await hash(body.password, 10)
      updates.push(`password_hash = $${idx++}`)
      params.push(pwHash)
    }
    updates.push(`updated_at = NOW()`)

    if (updates.length === 1) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    params.push(id)
    await query(`UPDATE "user" SET ${updates.join(', ')} WHERE id = $${idx}`, params)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    if (currentUser.id === id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    const targetUser = await queryOne<{ role: string }>('SELECT role FROM "user" WHERE id = $1', [id])
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (targetUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can delete other super admins' }, { status: 403 })
    }

    await query('DELETE FROM "user" WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
