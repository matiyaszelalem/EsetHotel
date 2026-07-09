'use client'

import { useEffect, useState } from 'react'
import { 
  Calendar, 
  Bed, 
  CreditCard, 
  Loader2, 
  AlertCircle, 
  X, 
  MapPin, 
  Info,
  Clock,
  Compass,
  ArrowUpRight,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { generateInvoice } from '@/lib/pdf'
import { useConfirm } from '@/hooks/use-confirm'

interface BookingRoom {
  room: {
    roomNumber: string
    roomType: {
      name: string
    }
  }
}

interface Booking {
  id: string
  referenceId: string
  checkIn: string
  checkOut: string
  status: string
  totalPrice: number
  paymentMethod: string
  payment: {
    status: string
  } | null
  rooms: BookingRoom[]
}

export default function MyBookingsPage() {
  const { confirm, dialog } = useConfirm()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Modification Modal State
  const [modifyBookingId, setModifyBookingId] = useState<string | null>(null)
  const [modifyText, setModifyText] = useState('')
  const [modifyLoading, setModifyLoading] = useState(false)
  const [modifyError, setModifyError] = useState('')

  const fetchBookings = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/account/bookings')
      if (!res.ok) throw new Error('Failed to load reservations')
      const data = await res.json()
      setBookings(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleCancelBooking = async (id: string) => {
    if (!await confirm('Are you sure you want to cancel this reservation? This cannot be undone.')) return
    
    setActionLoading(id)
    try {
      const res = await fetch(`/api/account/bookings?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel booking')
      }

      fetchBookings()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRequestModification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modifyBookingId || !modifyText) return

    setModifyLoading(true)
    setModifyError('')
    try {
      const res = await fetch(`/api/account/bookings/${modifyBookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modificationRequest: modifyText }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit modification request')
      }

      setModifyBookingId(null)
      setModifyText('')
      fetchBookings()
      alert('Modification request submitted successfully. The hotel staff will contact you shortly.')
    } catch (err: any) {
      setModifyError(err.message || 'An error occurred')
    } finally {
      setModifyLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50">Confirmed</span>
      case 'CHECKED_IN':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">Checked In</span>
      case 'CHECKED_OUT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200/50">Checked Out</span>
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200/50">Cancelled</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/50">{status}</span>
    }
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="flex h-[40vh] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING')
  const completedBookings = bookings.filter(b => b.status === 'CHECKED_OUT')
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED')
  const activeBookings = bookings.filter(b => b.status === 'CHECKED_IN')

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">My Reservations</h1>
          <p className="text-sm text-slate-500">View your current, past, and cancelled stays at Eset Hotel.</p>
        </div>
        <Link 
          href="/booking" 
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-sm"
        >
          <span>Book Another Stay</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Active Stays */}
      {activeBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Current Stay</h2>
          {activeBookings.map(booking => {
            const room = booking.rooms?.[0]?.room
            return (
              <div key={booking.id} className="bg-primary-light/50 border border-primary/20 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary text-primary-foreground font-mono">{booking.referenceId}</span>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">You are currently staying in Room {room?.roomNumber || 'N/A'}</h3>
                    <p className="text-sm text-slate-500">{room?.roomType.name || 'Standard Room'}</p>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <p>Check-In: <strong className="text-slate-800">{new Date(booking.checkIn).toLocaleDateString()}</strong></p>
                    <p>Check-Out: <strong className="text-slate-800">{new Date(booking.checkOut).toLocaleDateString()}</strong></p>
                  </div>
                </div>
                  <div className="flex flex-col justify-end text-right gap-3">
                    <div>
                      <span className="text-xs text-slate-400 block">Total Charged</span>
                      <span className="text-xl font-bold text-slate-800">${booking.totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => generateInvoice(booking)}
                      className="px-3 py-1.5 bg-primary-light text-primary hover:bg-primary/20 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download size={14} /> Invoice
                    </button>
                  </div>
                </div>
            )
          })}
        </div>
      )}

      {/* Upcoming Stays */}
      <div className="space-y-4">
        <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Upcoming Stays ({upcomingBookings.length})</h2>
        {upcomingBookings.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            You don't have any upcoming reservations.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingBookings.map((booking) => {
              const roomType = booking.rooms?.[0]?.room.roomType
              const checkIn = new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const checkOut = new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              
              return (
                <div 
                  key={booking.id} 
                  className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground font-mono block">REF: {booking.referenceId}</span>
                        <h3 className="font-bold text-foreground text-base mt-1">{roomType?.name || 'Hotel Stay'}</h3>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="space-y-2 text-xs text-slate-500">
                      <p className="flex items-center gap-2">
                        <Calendar size={14} className="text-primary" />
                        <span>{checkIn} – {checkOut}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <span>Bole Road, Addis Ababa, Ethiopia</span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border mt-6 pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs text-slate-400 block">Total Price</span>
                        <span className="font-bold text-slate-800">${booking.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setModifyBookingId(booking.id)
                          setModifyText('')
                          setModifyError('')
                        }}
                        className="px-3.5 py-1.5 border border-border text-foreground/70 hover:bg-muted font-semibold rounded-lg text-xs transition-colors"
                      >
                        Request Mod
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="px-3.5 py-1.5 border border-destructive/20 text-destructive hover:bg-destructive/5 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                      >
                        {actionLoading === booking.id && <Loader2 className="h-3 w-3 animate-spin" />}
                        <span>Cancel Stay</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Completed & Cancelled Stays */}
      {(completedBookings.length > 0 || cancelledBookings.length > 0) && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Past Stays</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border shadow-sm overflow-hidden">
            {[...completedBookings, ...cancelledBookings].map((booking) => {
              const roomType = booking.rooms?.[0]?.room.roomType
              const checkIn = new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const checkOut = new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              
              return (
                <div key={booking.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/50 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono text-muted-foreground">REF: {booking.referenceId}</span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <h4 className="font-semibold text-slate-800 text-sm">{roomType?.name || 'Hotel Stay'}</h4>
                    <p className="text-xs text-slate-400">{checkIn} – {checkOut}</p>
                  </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 block">Amount</span>
                      <span className="font-bold text-slate-800">${booking.totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => generateInvoice(booking)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Download Invoice"
                    >
                      <Download size={16} />
                    </button>
                  </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modification Modal */}
      {modifyBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-xl max-w-md w-full shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-foreground">Request Modification</h3>
                <p className="text-xs text-slate-400">Change dates, room type, or add requests.</p>
              </div>
            </div>

            <form onSubmit={handleRequestModification} className="p-6 space-y-4">
              {modifyError && (
                <div className="flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle size={16} />
                  <span>{modifyError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Your Request</label>
                <textarea
                  required
                  value={modifyText}
                  onChange={(e) => setModifyText(e.target.value)}
                  placeholder="E.g. I would like to change my check-in date to tomorrow..."
                  rows={4}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModifyBookingId(null)}
                  className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modifyLoading}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                >
                  {modifyLoading && <Loader2 size={14} className="animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {dialog}
    </div>
  )
}
