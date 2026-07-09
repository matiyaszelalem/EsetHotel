import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, phone } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM "user" WHERE email = $1', [email]
    )

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    const user = await queryOne<{
      id: string
      name: string
      email: string
      role: string
      phone: string | null
    }>(
      `INSERT INTO "user" (name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, 'GUEST', $4)
       RETURNING id, name, email, role, phone`,
      [name, email, hashedPassword, phone || null]
    )

    return NextResponse.json({
      id: user!.id,
      name: user!.name,
      email: user!.email,
      role: user!.role,
      phone: user!.phone,
    })
  } catch (error: any) {
    console.error('Error in user registration:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
