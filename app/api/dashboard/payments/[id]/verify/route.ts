import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const { action } = await req.json()

    if (!action || !['CONFIRM', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be CONFIRM or REJECT' }, { status: 400 })
    }

    const payment = await queryOne<{ id: string; status: string; booking_id: string }>(
      'SELECT id, status, booking_id FROM payment WHERE id = $1', [id]
    )
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    if (payment.status !== 'PENDING') {
      return NextResponse.json({ error: 'Payment is not in PENDING status' }, { status: 400 })
    }

    if (action === 'CONFIRM') {
      await query(
        `UPDATE payment SET status = 'COMPLETED', verified_by = $1, verified_at = NOW() WHERE id = $2`,
        [user.id, id]
      )

      const booking = await queryOne<{ reference_id: string; guest_name: string }>(
        'SELECT reference_id, guest_name FROM booking WHERE id = $1', [payment.booking_id]
      )

      try {
        const { createNotification } = await import('@/lib/notifications')
        await createNotification(
          'PAYMENT_VERIFIED',
          'Payment Confirmed',
          `${booking?.guest_name} — payment verified by ${user.name}`,
          payment.booking_id
        )
      } catch {}

      return NextResponse.json({ success: true, message: 'Payment confirmed' })
    }

    if (action === 'REJECT') {
      await query(
        `UPDATE payment SET status = 'FAILED', verified_by = $1, verified_at = NOW() WHERE id = $2`,
        [user.id, id]
      )

      const booking = await queryOne<{ id: string; guest_name: string; guest_email: string; reference_id: string }>(
        'SELECT id, guest_name, guest_email, reference_id FROM booking WHERE id = $1', [payment.booking_id]
      )

      if (booking) {
        await query(
          `UPDATE booking SET status = 'CANCELLED' WHERE id = $1`,
          [booking.id]
        )

        try {
          const { sendCancellationEmail } = await import('@/lib/email')
          void sendCancellationEmail(booking)
        } catch {}

        try {
          const { createNotification } = await import('@/lib/notifications')
          await createNotification(
            'PAYMENT_REJECTED',
            'Payment Rejected',
            `${booking.guest_name} — payment rejected by ${user.name}`,
            booking.reference_id
          )
        } catch {}
      }

      return NextResponse.json({ success: true, message: 'Payment rejected' })
    }
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
