'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Calendar, Users, MapPin, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { formatDualPriceCompact, fetchEtbRate } from '@/lib/dual-pricing'

interface Booking {
  referenceId: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  checkIn: string
  checkOut: string
  guests: number
  status: string
  totalPrice: number
  paymentMethod: string
  specialRequests: string | null
  createdAt: string
  rooms: {
    room: {
      roomNumber: string
      roomType: { name: string }
    }
  }[]
  payment: { status: string } | null
}

export default function BookingLookupPage() {
  const [referenceId, setReferenceId] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [etbRate, setEtbRate] = useState(120)

  useEffect(() => {
    fetchEtbRate().then(setEtbRate)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!referenceId.trim()) return

    setLoading(true)
    setError('')
    setBooking(null)
    setSearched(true)

    try {
      const res = await fetch(`/api/bookings/lookup?reference=${encodeURIComponent(referenceId.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Booking not found')
      }

      setBooking(data)
    } catch (err: any) {
      setError(err.message || 'Failed to look up booking')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20">Confirmed</span>
      case 'CHECKED_IN':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">Checked In</span>
      case 'CHECKED_OUT':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200/50">Checked Out</span>
      case 'CANCELLED':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200/50">Cancelled</span>
      case 'PENDING':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/50">Pending</span>
      default:
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="mx-auto max-w-[700px] px-6">

        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <div className="rounded-[24px] border border-border bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 px-8 py-10 text-center border-b border-border/50">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Search size={28} className="text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-semibold text-foreground mb-2">Find Your Booking</h1>
            <p className="text-muted-foreground text-sm max-w-[380px] mx-auto">
              Enter your booking reference number (e.g., ESET-123456) to view and manage your reservation.
            </p>
          </div>

          {/* Search Form */}
          <div className="p-8 sm:p-10">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
                placeholder="ESET-XXXXXX"
                className="flex-1 rounded-[10px] border border-border bg-background px-5 py-3.5 text-sm font-mono tracking-wider uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                required
              />
              <button
                type="submit"
                disabled={loading || !referenceId.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60 transition-all"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Results */}
            <div className="mt-8">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Looking up your booking...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 rounded-[12px] border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {searched && !loading && !error && !booking && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No booking found with that reference number.</p>
                  <p className="text-xs text-muted-foreground mt-2">Please check the reference number and try again.</p>
                </div>
              )}

              {booking && (
                <div className="space-y-6">
                  {/* Status Header */}
                  <div className="flex items-center justify-between bg-muted/50 rounded-[12px] p-4 border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Reference</p>
                      <p className="font-mono text-lg font-bold text-foreground tracking-wider">{booking.referenceId}</p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Guest Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="rounded-[12px] border border-border p-5">
                      <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Guest Details</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">{booking.guestName}</span></p>
                        <p>{booking.guestEmail}</p>
                        {booking.guestPhone && <p>{booking.guestPhone}</p>}
                      </div>
                    </div>

                    <div className="rounded-[12px] border border-border p-5">
                      <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Stay Details</h3>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <Calendar size={14} className="text-primary" />
                          <span>{new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <Users size={14} className="text-primary" />
                          <span>{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</span>
                        </div>
                        {booking.rooms[0] && (
                          <div className="flex items-center gap-2.5 text-muted-foreground">
                            <MapPin size={14} className="text-primary" />
                            <span>Room {booking.rooms[0].room.roomNumber} ({booking.rooms[0].room.roomType.name})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="rounded-[12px] border border-border p-5">
                    <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Payment Summary</h3>
                    <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                      <span>Total Charges</span>
                      <div>
                        <span className="font-semibold text-foreground">${booking.totalPrice.toFixed(2)}</span>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          ≈ {formatDualPriceCompact(booking.totalPrice, etbRate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Payment Status</span>
                      <span className={`font-semibold ${booking.payment?.status === 'COMPLETED' ? 'text-success' : 'text-warning'}`}>
                        {booking.payment?.status === 'COMPLETED' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Method</span>
                      <span className="font-medium text-foreground">
                        {booking.paymentMethod === 'STRIPE' ? 'Online (Stripe)' : 'Pay at Hotel'}
                      </span>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {booking.specialRequests && (
                    <div className="rounded-[12px] border border-border p-5">
                      <h3 className="font-heading text-sm font-semibold text-foreground mb-2">Special Requests</h3>
                      <p className="text-sm text-muted-foreground">{booking.specialRequests}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      href="/"
                      className="flex-1 inline-flex justify-center items-center rounded-[10px] border border-border bg-background px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Back to Home
                    </Link>
                    <Link
                      href={`/booking/confirmation/${booking.referenceId}`}
                      className="flex-1 inline-flex justify-center items-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark"
                    >
                      <CheckCircle size={16} />
                      View Confirmation
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
