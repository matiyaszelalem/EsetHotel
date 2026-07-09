'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useConfirm } from '@/hooks/use-confirm'
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  Mail, 
  Phone, 
  User, 
  Tag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Bed,
  Layers,
  DollarSign,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { generateInvoice } from '@/lib/pdf'

interface BookingRoom {
  id: string
  pricePerNight: number
  room: {
    roomNumber: string
    roomType: {
      name: string
      basePrice: number
    }
  }
}

interface Booking {
  id: string
  referenceId: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  specialRequests: string | null
  modificationRequest: string | null
  checkIn: string
  checkOut: string
  guests: number
  status: string
  paymentMethod: string
  totalPrice: number
  currency: string
  source: string
  checkedInAt: string | null
  checkedOutAt: string | null
  createdAt: string
  payment: {
    status: string
    amount: number
  } | null
  rooms: BookingRoom[]
}

export default function BookingDetail() {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()
  const { id } = useParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchBooking = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/dashboard/bookings/${id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Booking not found')
      }
      const data = await res.json()
      setBooking(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [id])

  const handleUpdateStatus = async (status: string, paymentStatus?: string) => {
    setActionLoading(true)
    try {
      const updateData: any = { status }
      if (paymentStatus) updateData.paymentStatus = paymentStatus
      if (status === 'CHECKED_IN') updateData.checkedInAt = new Date().toISOString()
      if (status === 'CHECKED_OUT') updateData.checkedOutAt = new Date().toISOString()

      const res = await fetch(`/api/dashboard/bookings?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update booking status')
      }

      await fetchBooking()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="space-y-4 max-w-md mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="font-heading text-lg font-bold">Error Loading Booking</h2>
        <p className="text-sm text-muted-foreground">{error || 'Something went wrong.'}</p>
        <Link href="/dashboard/bookings" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft size={16} /> Back to bookings
        </Link>
      </div>
    )
  }

  const roomInfo = booking.rooms?.[0]
  const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))

  // Determine timeline steps
  const steps = [
    { label: 'Booked', date: new Date(booking.createdAt).toLocaleDateString(), completed: true },
    { label: 'Confirmed', date: new Date(booking.createdAt).toLocaleDateString(), completed: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(booking.status) },
    { label: 'Checked In', date: booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleString() : null, completed: ['CHECKED_IN', 'CHECKED_OUT'].includes(booking.status) },
    { label: 'Checked Out', date: booking.checkedOutAt ? new Date(booking.checkedOutAt).toLocaleString() : null, completed: booking.status === 'CHECKED_OUT' }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <Link 
            href="/dashboard/bookings" 
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to bookings
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Reservation {booking.referenceId}
            </h1>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border uppercase ${
              booking.status === 'CONFIRMED' ? 'bg-success/10 text-success border-success/20' :
              booking.status === 'CHECKED_IN' ? 'bg-warning/10 text-warning border-warning/20' :
              booking.status === 'CHECKED_OUT' ? 'bg-muted text-muted-foreground border-border' :
              'bg-destructive/10 text-destructive border-destructive/20'
            }`}>
              {booking.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {booking.status === 'CONFIRMED' && (
            <button
              onClick={() => handleUpdateStatus('CHECKED_IN')}
              disabled={actionLoading}
              className="px-4 py-2 bg-warning hover:bg-warning/90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              Check In Guest
            </button>
          )}
          {booking.status === 'CHECKED_IN' && (
            <button
              onClick={() => handleUpdateStatus('CHECKED_OUT', 'COMPLETED')}
              disabled={actionLoading}
              className="px-4 py-2 bg-success hover:bg-success/80 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              Complete Check Out
            </button>
          )}
          {['CONFIRMED', 'PENDING'].includes(booking.status) && (
            <>
              <button
                onClick={async () => {
                  if (await confirm('Cancel this reservation? This cannot be undone.')) {
                    handleUpdateStatus('CANCELLED')
                  }
                }}
                disabled={actionLoading}
                className="px-4 py-2 border border-destructive/20 text-destructive hover:bg-destructive/5 disabled:opacity-50 text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (await confirm('Mark as NO-SHOW? This will cancel the reservation and release the room.')) {
                    handleUpdateStatus('NO_SHOW')
                  }
                }}
                disabled={actionLoading}
                className="px-4 py-2 border border-border text-foreground/70 hover:bg-muted disabled:opacity-50 text-sm font-semibold rounded-lg transition-colors"
              >
                Mark No-Show
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      {booking.status !== 'CANCELLED' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6">Stay Progress Timeline</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 relative z-10">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                  step.completed 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'bg-background border-border text-muted-foreground'
                }`}>
                  {step.completed ? '✓' : idx + 1}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{step.date || 'Pending'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Guest details + Booking parameters */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Guest Profile Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-3">Guest Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted text-muted-foreground rounded-lg"><User size={18} /></div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Guest Name</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{booking.guestName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted text-muted-foreground rounded-lg"><Mail size={18} /></div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Email Address</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{booking.guestEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted text-muted-foreground rounded-lg"><Phone size={18} /></div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Phone Number</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{booking.guestPhone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted text-muted-foreground rounded-lg"><Calendar size={18} /></div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Check-In / Out Dates</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5 flex items-start gap-3">
              <div className="p-2 bg-muted text-muted-foreground rounded-lg"><Layers size={18} /></div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Special Requests / Notes</p>
                  <p className="text-sm text-foreground/80 bg-muted/50 rounded-lg p-3 border border-border mt-1.5 leading-relaxed italic">
                    {booking.specialRequests || 'No special requests for this booking.'}
                  </p>
                </div>
                
                {booking.modificationRequest && (
                  <div>
                    <p className="text-xs font-semibold text-warning uppercase flex items-center gap-1">
                      <AlertCircle size={14} /> Modification Requested
                    </p>
                    <p className="text-sm text-warning bg-warning/10 rounded-lg p-3 border border-warning/20 mt-1.5 leading-relaxed font-medium">
                      {booking.modificationRequest}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Rooms Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-3">Assigned Room</h3>
            {roomInfo ? (
              <div className="flex items-center justify-between p-4 bg-muted border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-primary-light text-primary rounded-lg flex items-center justify-center font-bold">
                    {roomInfo.room.roomNumber}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{roomInfo.room.roomType.name}</h4>
                    <p className="text-xs text-muted-foreground">Capacity: 2 Guests • Bed type configured</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Rate/Night</span>
                  <p className="font-bold text-foreground">${roomInfo.pricePerNight.toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span>No physical room has been allocated. Please contact administrator.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Stay Breakdown & Payments info */}
        <div className="space-y-6">
          
          {/* Payment Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-3">Stay & Invoice Summary</h3>
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Room Cost ({nights} nights)</span>
                <span className="text-foreground/80">${(booking.totalPrice / 1.15).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Estimated Taxes (15%)</span>
                <span className="text-foreground/80">${(booking.totalPrice - (booking.totalPrice / 1.15)).toFixed(2)}</span>
              </div>
              <div className="border-t border-border my-2 pt-3 flex justify-between font-bold text-base">
                <span className="text-foreground">Total Price</span>
                <span className="text-foreground">${booking.totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold uppercase">Payment Mode</span>
                <span className="text-foreground font-bold bg-muted border border-border rounded px-2.5 py-1 uppercase">{booking.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-semibold uppercase">Invoice Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                  booking.payment?.status === 'COMPLETED' 
                    ? 'bg-success/10 text-success border-success/20' 
                    : 'bg-warning/10 text-warning border-warning/20'
                }`}>
                  {booking.payment?.status || 'PENDING'}
                </span>
              </div>

              {booking.payment?.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleUpdateStatus(booking.status, 'COMPLETED')}
                  disabled={actionLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-success hover:bg-success/80 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  <CreditCard size={14} />
                  <span>Mark Invoice as Paid</span>
                </button>
              )}

              <button
                onClick={() => generateInvoice(booking)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-ink hover:bg-ink-soft text-primary-foreground text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <Download size={14} />
                <span>Download PDF Invoice</span>
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-ink text-white/50 rounded-xl p-5 text-xs space-y-3">
            <h4 className="font-semibold text-white uppercase text-[10px] tracking-wider">Reservation Metadata</h4>
            <div className="space-y-1.5 leading-relaxed">
              <p>Booking ID: <span className="font-mono text-white/70">{booking.id}</span></p>
              <p>Source Channel: <span className="font-medium text-white/70 uppercase">{booking.source}</span></p>
              <p>Created Date: <span className="text-white/70">{new Date(booking.createdAt).toLocaleString()}</span></p>
            </div>
          </div>
        </div>

      </div>
      {dialog}
    </div>
  )
}
