import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, subject, message } = body

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 })
    }
    if (!subject) {
      return NextResponse.json({ error: 'Please select a subject' }, { status: 400 })
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message must be under 2000 characters' }, { status: 400 })
    }

    await query(
      'INSERT INTO contact_message (name, email, phone, subject, message) VALUES ($1, $2, $3, $4, $5)',
      [name.trim(), email.trim(), phone?.trim() || null, subject, message.trim()]
    )

    try {
      const { createNotification } = await import('@/lib/notifications')
      await createNotification(
        'CONTACT_MESSAGE',
        'New Contact Message',
        `${name.trim()} — ${subject}`
      )
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error submitting contact form:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
