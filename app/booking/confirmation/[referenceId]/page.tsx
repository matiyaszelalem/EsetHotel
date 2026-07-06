import Link from 'next/link'
import { CheckCircle, Calendar, Users, MapPin, ArrowRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getEtbRate, formatDualPriceCompact } from '@/lib/dual-pricing'
import { queryOne, query } from '@/lib/db'

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ referenceId: string }>
}) {
  const { referenceId } = await params

  const booking = await queryOne<{
    id: string
    reference_id: string
    guest_name: string
    guest_email: string
    guest_phone: string | null
    special_requests: string | null
    check_in: string
    check_out: string
    guests: number
    status: string
    total_price: number
    payment_method: string
  }>('SELECT * FROM booking WHERE reference_id = $1', [referenceId])

  if (!booking) {
    notFound()
  }

  const bookingRooms = await query<{
    room_id: string
    room_number: string
    room_type_id: string
    room_type_name: string
    room_type_base_price: number
  }>(
    `SELECT r.id as room_id, r.room_number, r.room_type_id, rt.name as room_type_name, rt.base_price as room_type_base_price
     FROM booking_room br
     JOIN room r ON r.id = br.room_id
     JOIN room_type rt ON rt.id = r.room_type_id
     WHERE br.booking_id = $1`,
    [booking.id]
  )

  const payment = await queryOne<{
    id: string
    status: string
    amount: number
  }>('SELECT id, status, amount FROM payment WHERE booking_id = $1', [booking.id])

  const checkInDate = new Date(booking.check_in)
  const checkOutDate = new Date(booking.check_out)
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  const roomInfo = bookingRooms[0]
  const etbRate = await getEtbRate()
  const subtotal = roomInfo ? nights * roomInfo.room_type_base_price : booking.total_price / 1.15
  const taxes = booking.total_price - subtotal

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="mx-auto max-w-[800px] px-6">

        <div className="rounded-[24px] bg-card border border-border shadow-sm overflow-hidden text-center">

          <div className="bg-primary/10 py-12 px-6 flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-primary-foreground" />
            </div>
            <h1 className="font-heading text-4xl font-semibold text-foreground mb-4">Booking Confirmed!</h1>
            <p className="text-muted-foreground font-sans max-w-[400px]">
              Thank you for choosing Eset Hotel. We have sent a confirmation email with all the details of your stay.
            </p>
          </div>

          <div className="p-8 sm:p-12 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-10 border-b border-border/50">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Booking Reference</div>
                <div className="font-mono text-2xl font-bold tracking-wider text-primary">{referenceId}</div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <div className="inline-flex items-center rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success uppercase tracking-wide">
                  {booking.status === 'CONFIRMED' ? 'Confirmed' : booking.status}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Guest Details</h3>
                <div className="space-y-2 text-sm font-sans text-muted-foreground">
                  <div className="font-medium text-foreground">{booking.guest_name}</div>
                  <div>{booking.guest_email}</div>
                  {booking.guest_phone && <div>{booking.guest_phone}</div>}
                </div>
              </div>

              <div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Stay Information</h3>
                <div className="space-y-3 text-sm font-sans text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-primary" />
                    <span>
                      {checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-primary" />
                    <span>{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}{roomInfo ? ` (${roomInfo.room_type_name})` : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-primary" />
                    <span>Bole Road, Addis Ababa</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[12px] bg-muted/50 p-6 border border-border">
              <h3 className="font-heading text-base font-semibold text-foreground mb-3">Payment Summary</h3>
              <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                <span>Room Total ({nights} {nights === 1 ? 'night' : 'nights'})</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-4 text-muted-foreground">
                <span>Taxes & Fees</span>
                <span>${taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-foreground border-t border-border/50 pt-3">
                <span>Total Charged</span>
                <div className="text-right">
                  <span>${booking.total_price.toFixed(2)}</span>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">
                    ≈ {formatDualPriceCompact(booking.total_price, etbRate)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                <span>Payment Method</span>
                <span>{booking.payment_method === 'STRIPE' ? 'Online (Stripe)' : 'Pay at Hotel'}</span>
              </div>
              {payment && (
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Payment Status</span>
                  <span className={payment.status === 'COMPLETED' ? 'text-success font-semibold' : 'text-warning font-semibold'}>
                    {payment.status === 'COMPLETED' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              )}
            </div>

            {booking.special_requests && (
              <div className="mt-6 rounded-[12px] border border-border p-5">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-2">Special Requests</h3>
                <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
              </div>
            )}

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/" className="w-full sm:w-auto inline-flex justify-center items-center rounded-[8px] border border-border bg-background px-6 py-3 text-sm font-medium transition-colors hover:bg-muted">
                Back to Home
              </Link>
              <Link href="/booking/lookup" className="w-full sm:w-auto inline-flex justify-center items-center rounded-[8px] bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 gap-2 group">
                Manage Booking
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
