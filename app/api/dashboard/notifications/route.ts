import { NextResponse } from 'next/server'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/notifications'

export async function GET() {
  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(50),
      getUnreadCount(),
    ])
    return NextResponse.json({ notifications, unreadCount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()

    if (body.markAllRead) {
      await markAllAsRead()
      return NextResponse.json({ success: true })
    }

    if (body.id) {
      await markAsRead(body.id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Missing id or markAllRead' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
