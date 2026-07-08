import { compare } from 'bcryptjs'
import { NextResponse } from 'next/server'
import { queryOne, testConnection } from '@/lib/db'
import { signToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const dbOk = await testConnection()
    if (!dbOk) {
      return NextResponse.json({
        error: 'Database connection failed. Check that DATABASE_URL is set correctly on Vercel.',
      }, { status: 500 })
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
    const isDebug = process.env.SERVER_DEBUG === 'true' || process.env.NEXT_PUBLIC_DEBUG === 'true'
    const message = isDebug ? error?.message || 'Internal Server Error' : 'Database connection failed. Check that DATABASE_URL is set correctly on Vercel. Set SERVER_DEBUG=true to see the full error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
