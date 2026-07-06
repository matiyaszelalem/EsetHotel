import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { queryOne, execute } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    const user = await queryOne('SELECT id FROM "user" WHERE email = $1', [email])
    if (!user) return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await execute(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, token, expiresAt]
    )

    await sendPasswordResetEmail(email, token)

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
