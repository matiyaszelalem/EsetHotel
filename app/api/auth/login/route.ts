import { compare } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const user = await queryOne<{
      id: string; name: string; email: string; password_hash: string; role: string; phone: string | null
    }>('SELECT * FROM "user" WHERE email = $1', [email])

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const isValid = await compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const tokenUser = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    const token = signToken(tokenUser)

    const response = NextResponse.json(tokenUser)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Error in login:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
