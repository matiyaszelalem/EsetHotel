'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Hotel, Building2, Tag, Loader2, AlertCircle } from 'lucide-react'

const roomImageMap: Record<string, string> = {
  'standard-room': '/images/standard-room.png',
  'deluxe-room': '/images/deluxe-room.png',
  'executive-suite': '/images/executive-suite.png',
  'family-room': '/images/family-room.png',
  'presidential-suite': '/images/presidential-suite.png',
}
import { formatDualPriceCompact, fetchEtbRate } from '@/lib/dual-pricing'
import { z } from 'zod'

const dateSchema = z.object({
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
}).refine(
  (data) => !isNaN(new Date(data.checkIn).getTime()),
  { message: 'Invalid check-in date', path: ['checkIn'] }
).refine(
  (data) => !isNaN(new Date(data.checkOut).getTime()),
  { message: 'Invalid check-out date', path: ['checkOut'] }
).refine(
  (data) => {
    const checkIn = new Date(data.checkIn)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    return checkIn >= today
  },
  { message: 'Check-in date cannot be in the past', path: ['checkIn'] }
).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: 'Check-out must be after check-in', path: ['checkOut'] }
).refine(
  (data) => {
    const checkIn = new Date(data.checkIn)
    const checkOut = new Date(data.checkOut)
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000) >= 1
  },
  { message: 'Minimum stay is 1 night' }
)

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // URL parameters
  const roomSlug = searchParams.get('room') || 'standard'
  const checkInStr = searchParams.get('checkIn') || ''
  const checkOutStr = searchParams.get('checkOut') || ''
  const guestsCount = searchParams.get('guests') || '2'

  // Room details loaded from DB
  const [roomType, setRoomType] = useState<any>(null)
  const [loadingRoom, setLoadingRoom] = useState(true)

  // Guest details form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [requests, setRequests] = useState('')

  // Promo code state
  const [promoCode, setPromoCode] = useState('')
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<any>(null) // { id, code, discountAmount }

  const [paymentMethod, setPaymentMethod] = useState<'PAY_AT_HOTEL' | 'bank_transfer'>('PAY_AT_HOTEL')
  const [verificationMethod, setVerificationMethod] = useState<'TRANSACTION_ID' | 'PAYMENT_LINK'>('TRANSACTION_ID')
  const [verificationData, setVerificationData] = useState('')
  const [etbRate, setEtbRate] = useState(120)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    fetchEtbRate().then(setEtbRate)
  }, [])

  // Calculate nights
  const checkInDate = checkInStr ? new Date(checkInStr) : new Date()
  const checkOutDate = checkOutStr ? new Date(checkOutStr) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)))

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const res = await fetch('/api/room-types')
        if (res.ok) {
          const roomTypes = await res.json()
          const matched = roomTypes.find((r: any) => r.slug === roomSlug)
          if (matched) {
            setRoomType(matched)
          }
        }
      } catch (err) {
        console.error('Failed to load room details:', err)
      } finally {
        setLoadingRoom(false)
      }
    }
    fetchRoomDetails()
  }, [roomSlug])

  // Pricing calculations
  const roomPrice = roomType ? roomType.basePrice : 150
  const subtotal = roomPrice * nights
  const discount = appliedPromo ? appliedPromo.discountAmount : 0
  const taxableSubtotal = Math.max(0, subtotal - discount)
  const taxes = taxableSubtotal * 0.15
  const total = taxableSubtotal + taxes

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')
    setPromoSuccess('')
    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, subtotal }),
      })
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Invalid promo code')
      }
      setAppliedPromo({
        id: data.promoCodeId,
        code: data.code,
        discountAmount: data.discountAmount
      })
      setPromoSuccess(`Promo code ${data.code} applied successfully!`)
    } catch (err: any) {
      setPromoError(err.message || 'Failed to apply promo code')
      setAppliedPromo(null)
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoCode('')
    setPromoSuccess('')
    setPromoError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDateError('')
    setSubmitError('')

    const parsed = dateSchema.safeParse({ checkIn: checkInStr, checkOut: checkOutStr })
    if (!parsed.success) {
      setDateError(parsed.error.issues[0].message)
      return
    }

    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomSlug,
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate.toISOString(),
          guests: guestsCount,
          guestName: `${firstName} ${lastName}`,
          guestEmail: email,
          guestPhone: phone,
          specialRequests: requests,
          paymentMethod,
          promoCode: appliedPromo ? appliedPromo.code : null,
          verificationMethod: paymentMethod === 'bank_transfer' ? verificationMethod : null,
          verificationData: paymentMethod === 'bank_transfer' ? verificationData : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete booking')
      }

      router.push(`/booking/confirmation/${data.referenceId}`)
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during booking creation. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="mx-auto max-w-[1200px] px-6">
        
        <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back() }} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Room Details
        </Link>

        {(submitError || dateError) && (
          <div className="mb-6 flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{dateError || submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Form Content */}
          <div className="lg:col-span-8">
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-8">Complete your booking</h1>
            
            <form onSubmit={handleSubmit} id="checkout-form">
              <div className="rounded-[16px] border border-border bg-card p-6 sm:p-8 mb-8 shadow-sm">
                <h2 className="font-heading text-xl font-semibold text-foreground mb-6 border-b border-border/50 pb-4">Guest Details</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</label>
                    <input required type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-[8px] border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</label>
                    <input required type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-[8px] border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Doe" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                    <input required type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-[8px] border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="john.doe@example.com" />
                    <p className="text-xs text-muted-foreground mt-1">We&apos;ll send your booking confirmation here.</p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</label>
                    <input required type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-[8px] border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="requests" className="text-sm font-medium text-foreground">Special Requests (Optional)</label>
                    <textarea id="requests" value={requests} onChange={(e) => setRequests(e.target.value)} rows={3} className="w-full rounded-[8px] border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Late check-in, high floor, etc." />
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border border-border bg-card p-6 sm:p-8 shadow-sm mb-8">
                <h2 className="font-heading text-xl font-semibold text-foreground mb-6 border-b border-border/50 pb-4">Payment Method</h2>
                
                <div className="space-y-4">
                  <label onClick={() => setPaymentMethod('PAY_AT_HOTEL')} className={`flex cursor-pointer items-start gap-4 rounded-[12px] border p-4 transition-colors ${paymentMethod === 'PAY_AT_HOTEL' ? 'border-primary bg-primary/[0.02]' : 'border-border bg-background hover:border-primary/50'}`}>
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-primary">
                      {paymentMethod === 'PAY_AT_HOTEL' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-foreground mb-1">
                        <Hotel size={18} className="text-primary" />
                        Pay at Hotel
                      </div>
                      <p className="text-sm text-muted-foreground">Reserve now and pay when you check in. Cancellation policies still apply.</p>
                    </div>
                  </label>

                  <label onClick={() => setPaymentMethod('bank_transfer')} className={`flex cursor-pointer items-start gap-4 rounded-[12px] border p-4 transition-colors ${paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/[0.02]' : 'border-border bg-background hover:border-primary/50'}`}>
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-primary">
                      {paymentMethod === 'bank_transfer' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-foreground mb-1">
                        <Building2 size={18} className="text-primary" />
                        Bank Transfer
                      </div>
                      <p className="text-sm text-muted-foreground">Pay by bank transfer. Provide your transaction ID or payment link for verification.</p>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'bank_transfer' && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Verification Method</label>
                      <div className="flex gap-3">
                        <label className={`flex cursor-pointer items-center gap-2 rounded-[8px] border px-4 py-2 text-sm transition-colors ${verificationMethod === 'TRANSACTION_ID' ? 'border-primary bg-primary/[0.02] text-foreground' : 'border-border bg-background text-muted-foreground'}`}>
                          <input type="radio" name="verificationMethod" value="TRANSACTION_ID" checked={verificationMethod === 'TRANSACTION_ID'} onChange={() => setVerificationMethod('TRANSACTION_ID')} className="sr-only" />
                          Transaction ID
                        </label>
                        <label className={`flex cursor-pointer items-center gap-2 rounded-[8px] border px-4 py-2 text-sm transition-colors ${verificationMethod === 'PAYMENT_LINK' ? 'border-primary bg-primary/[0.02] text-foreground' : 'border-border bg-background text-muted-foreground'}`}>
                          <input type="radio" name="verificationMethod" value="PAYMENT_LINK" checked={verificationMethod === 'PAYMENT_LINK'} onChange={() => setVerificationMethod('PAYMENT_LINK')} className="sr-only" />
                          Payment Link
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="verificationData" className="text-sm font-medium text-foreground">
                        {verificationMethod === 'TRANSACTION_ID' ? 'Bank Transaction ID' : 'Payment Confirmation Link'}
                      </label>
                      <input
                        required
                        type={verificationMethod === 'PAYMENT_LINK' ? 'url' : 'text'}
                        id="verificationData"
                        value={verificationData}
                        onChange={(e) => setVerificationData(e.target.value)}
                        placeholder={verificationMethod === 'TRANSACTION_ID' ? 'e.g. BTR-12345-ABC' : 'e.g. https://bank.com/confirmation/...'}
                        className="w-full rounded-[8px] border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground">Our team will verify your payment and confirm your booking.</p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-[16px] border border-border bg-card p-6 shadow-sm space-y-6">
              <h3 className="font-heading text-xl font-semibold text-foreground">Stay Summary</h3>
              
                <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                <div className="h-16 w-20 rounded-[8px] bg-muted overflow-hidden flex-shrink-0">
                  <img src={roomImageMap[roomSlug] || '/images/hotel-corridor.png'} alt={roomType?.name || 'Room'} className="h-full w-full object-cover" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm mb-1">
                    {loadingRoom ? 'Loading Room...' : (roomType ? roomType.name : 'Standard Room')}
                  </div>
                  <div className="text-xs text-muted-foreground">{guestsCount} Guests • {nights} {nights === 1 ? 'Night' : 'Nights'}</div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pb-6 border-b border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium text-foreground">{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium text-foreground">{checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="pb-6 border-b border-border/50 space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={14} />
                  <span>Promo Code</span>
                </label>
                {!appliedPromo ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="WELCOME10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 rounded-[8px] border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none font-mono uppercase tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading}
                      className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-50 text-xs font-semibold rounded-[8px] transition-colors"
                    >
                      {promoLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-lg p-2.5 text-xs text-success font-mono">
                    <span className="font-bold">{appliedPromo.code} Applied</span>
                    <button type="button" onClick={handleRemovePromo} className="text-emerald-700 hover:text-emerald-950 font-sans font-bold">
                      Remove
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-destructive font-medium">{promoError}</p>}
                {promoSuccess && <p className="text-xs text-success font-medium">{promoSuccess}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">Room subtotal</div>
                  <div className="font-medium text-foreground">${subtotal}</div>
                </div>

                {appliedPromo && (
                  <div className="flex items-center justify-between text-sm text-success">
                    <div>Discount ({appliedPromo.code})</div>
                    <div className="font-semibold">-${discount.toFixed(2)}</div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">Taxes & Fees (15%)</div>
                  <div className="font-medium text-foreground">${taxes.toFixed(2)}</div>
                </div>
                {appliedPromo && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">Total after discount (ETB)</div>
                    <div className="font-medium text-xs font-mono text-muted-foreground">≈ {formatDualPriceCompact(taxableSubtotal, etbRate)}</div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-base font-semibold text-foreground">Total Due</div>
                  <div className="text-right">
                    <div className="text-2xl font-display font-bold text-primary">${total.toFixed(2)}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-0.5">
                      ≈ {formatDualPriceCompact(total, etbRate)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting || loadingRoom}
                className="flex w-full items-center justify-center rounded-[8px] bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-70 gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    {paymentMethod === 'bank_transfer' ? 'Submit for Verification' : 'Confirm Reservation'}
                  </span>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
