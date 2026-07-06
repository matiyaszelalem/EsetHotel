import { NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'
import { getCurrentUser, signToken } from '@/lib/auth'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await queryOne(
      `SELECT id, name, email, role, phone, created_at, updated_at
       FROM "user" WHERE id = $1`, [currentUser.id]
    )
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      id: user.id, name: user.name, email: user.email,
      role: user.role, phone: user.phone,
      createdAt: user.created_at, updatedAt: user.updated_at,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const sets: string[] = []
    const params: any[] = []
    let idx = 1

    if (body.name) { sets.push(`name = $${idx++}`); params.push(body.name) }
    if (body.phone !== undefined) { sets.push(`phone = $${idx++}`); params.push(body.phone) }
    if (body.email) { sets.push(`email = $${idx++}`); params.push(body.email) }

    if (sets.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    params.push(currentUser.id)
    const updated = await queryOne<{
      id: string; name: string; email: string; role: string; phone: string | null;
      created_at: string; updated_at: string;
    }>(
      `UPDATE "user" SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx}
       RETURNING id, name, email, role, phone, created_at, updated_at`,
      params
    )
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const newToken = signToken({
      id: updated.id, name: updated.name, email: updated.email,
      role: updated.role, phone: updated.phone,
    })

    const response = NextResponse.json({
      id: updated.id, name: updated.name, email: updated.email,
      role: updated.role, phone: updated.phone,
      createdAt: updated.created_at, updatedAt: updated.updated_at,
    })

    response.cookies.set('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
