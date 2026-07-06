import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { queryOne, execute } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const record = await queryOne<{
      id: string; email: string; token: string; expires_at: string; used: boolean
    }>(
      'SELECT * FROM password_reset_tokens WHERE token = $1',
      [token]
    )

    if (!record) return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    if (record.used) return NextResponse.json({ error: 'Token has already been used' }, { status: 400 })
    if (new Date(record.expires_at) < new Date()) return NextResponse.json({ error: 'Token has expired' }, { status: 400 })

    const passwordHash = await hash(password, 12)
    await execute('UPDATE "user" SET password_hash = $1, updated_at = NOW() WHERE email = $2', [passwordHash, record.email])
    await execute('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [record.id])

    return NextResponse.json({ message: 'Password has been reset successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
