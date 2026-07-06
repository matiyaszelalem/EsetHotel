import { query, queryOne } from './db'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  referenceId: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  BOOKING_NEW: 'CheckCircle',
  BOOKING_CHECK_IN: 'LogIn',
  BOOKING_CHECK_OUT: 'LogOut',
  BOOKING_CANCELLED: 'XCircle',
  PAYMENT_RECEIVED: 'DollarSign',
  CONTACT_MESSAGE: 'Mail',
  CHANNEL_SYNC: 'RefreshCw',
}

export async function ensureNotificationTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS notification (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      reference_id TEXT,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export async function createNotification(
  type: string,
  title: string,
  message: string,
  referenceId?: string
) {
  try {
    await ensureNotificationTable()
    await query(
      `INSERT INTO notification (type, title, message, reference_id) VALUES ($1, $2, $3, $4)`,
      [type, title, message, referenceId || null]
    )
  } catch (e) {
    console.error('Failed to create notification:', e)
  }
}

export async function getNotifications(limit = 50): Promise<Notification[]> {
  try {
    await ensureNotificationTable()
    const rows = await query(
      `SELECT id, type, title, message, reference_id, is_read, created_at
       FROM notification ORDER BY created_at DESC LIMIT $1`,
      [limit]
    )
    return rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      referenceId: r.reference_id,
      isRead: r.is_read,
      createdAt: r.created_at,
    }))
  } catch {
    return []
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    await ensureNotificationTable()
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM notification WHERE is_read = false`
    )
    return parseInt(result?.count || '0')
  } catch {
    return 0
  }
}

export async function markAsRead(id: string) {
  await query(`UPDATE notification SET is_read = true WHERE id = $1`, [id])
}

export async function markAllAsRead() {
  await query(`UPDATE notification SET is_read = true WHERE is_read = false`)
}
