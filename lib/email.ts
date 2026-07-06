import { Resend } from 'resend'

const from = process.env.EMAIL_FROM || 'Eset Hotel <no-reply@esethotel.com>'

function getClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export interface SendEmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const resend = getClient()

  if (!resend) {
    console.log('----------------------------------------------------')
    console.log(`[EMAIL STUB] TO: ${to}`)
    console.log(`[EMAIL STUB] SUBJECT: ${subject}`)
    console.log('----------------------------------------------------')
    return { success: true, stub: true }
  }

  const { error } = await resend.emails.send({ from, to: [to], subject, text, html })
  if (error) throw error
  return { success: true }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`
  const subject = 'Reset your Eset Hotel password'
  const text = `You requested a password reset.\n\nClick the link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, you can ignore this email.`
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #2A2520;">
      <h2 style="color: #B1843E;">Eset Hotel — Password Reset</h2>
      <p>You requested a password reset. Click the button below to set a new password.</p>
      <a href="${resetUrl}"
         style="display:inline-block; background:#B1843E; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold; margin:20px 0;">
        Reset Password
      </a>
      <p style="color:#888; font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `
  return sendEmail({ to: email, subject, text, html })
}

export async function sendBookingConfirmationEmail(booking: any) {
  const subject = `Booking Confirmation - ${booking.referenceId}`
  const text = `Dear ${booking.guestName},\n\nThank you for booking with Eset Hotel. Your reservation reference is ${booking.referenceId}.\nCheck-in: ${new Date(booking.checkIn).toLocaleDateString()}\nCheck-out: ${new Date(booking.checkOut).toLocaleDateString()}\nTotal Amount: $${booking.totalPrice.toFixed(2)}\n\nWe look forward to welcoming you!\n\nBest regards,\nEset Hotel Team`

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #2A2520;">
      <h2 style="color: #B1843E;">Eset Hotel Booking Confirmation</h2>
      <p>Dear <strong>${booking.guestName}</strong>,</p>
      <p>Thank you for choosing Eset Hotel. Your reservation has been confirmed.</p>
      <div style="background-color: #F8F4EE; padding: 15px; border-radius: 8px; border: 1px solid #E3DCD2; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Reservation Reference:</strong> <code style="color: #B1843E;">${booking.referenceId}</code></p>
        <p style="margin: 5px 0;"><strong>Check-in Date:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Check-out Date:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</p>
      </div>
      <p>We look forward to welcoming you!</p>
      <p>Warm regards,<br>Eset Hotel Team</p>
    </div>
  `

  return sendEmail({ to: booking.guestEmail, subject, text, html })
}

export async function sendCancellationEmail(booking: any) {
  const subject = `Reservation Cancelled - ${booking.referenceId}`
  const text = `Dear ${booking.guestName},\n\nYour reservation ${booking.referenceId} has been successfully cancelled.\n\nIf you have any questions, feel free to contact us.\n\nBest regards,\nEset Hotel Team`

  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #2A2520;">
      <h2 style="color: #CC5252;">Eset Hotel Booking Cancellation</h2>
      <p>Dear <strong>${booking.guestName}</strong>,</p>
      <p>Your reservation <strong>${booking.referenceId}</strong> has been cancelled.</p>
      <p>If this was a mistake or you have questions about refunds, please reply to this email or call our front desk.</p>
      <p>Warm regards,<br>Eset Hotel Team</p>
    </div>
  `

  return sendEmail({ to: booking.guestEmail, subject, text, html })
}
