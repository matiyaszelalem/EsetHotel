'use client'

import { useEffect, useState } from 'react'
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Loader2, 
  AlertCircle, 
  ConciergeBell,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Search,
  AlertTriangle,
  Building2,
  ShieldCheck,
  XCircle,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
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
  guestName: string
  guestEmail: string
  guestPhone: string | null
  specialRequests: string | null
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

interface PendingVerification {
  id: string
  referenceId: string
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  status: string
  totalPrice: number
  paymentMethod: string
  paymentId: string
  verificationMethod: string
  verificationData: string
  amount: number
}

export default function FrontDeskToday() {
  const { confirm, dialog } = useConfirm()
  const [arrivals, setArrivals] = useState<Booking[]>([])
  const [departures, setDepartures] = useState<Booking[]>([])
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchFrontDeskData = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/front-desk')
      if (!res.ok) throw new Error('Failed to load front-desk operations data')
      const data = await res.json()
      setArrivals(data.arrivals || [])
      setDepartures(data.departures || [])
      setPendingVerifications(data.pendingVerifications || [])
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPayment = async (paymentId: string, action: 'CONFIRM' | 'REJECT') => {
    setActionLoading(paymentId)
    try {
      const res = await fetch(`/api/dashboard/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to verify payment')
      }
      await fetchFrontDeskData()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    fetchFrontDeskData()
    const interval = setInterval(fetchFrontDeskData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleUpdateStatus = async (id: string, status: string, paymentStatus?: string) => {
    setActionLoading(id)
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
        throw new Error(data.error || 'Failed to update status')
      }

      await fetchFrontDeskData()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && arrivals.length === 0 && departures.length === 0) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Front Desk Board</h1>
          <p className="text-sm text-muted-foreground">Real-time check-in and check-out queue for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchFrontDeskData}
            className="p-2.5 bg-background border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link 
            href="/dashboard/front-desk/rooms" 
            className="px-4 py-2 border border-border text-foreground bg-background hover:bg-muted text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Room Board
          </Link>
          <Link 
            href="/dashboard/bookings" 
            className="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            New Reservation
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Verifications */}
      {pendingVerifications.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Building2 size={18} className="text-warning" />
              <span>Pending Payment Verifications ({pendingVerifications.length})</span>
            </h2>
            <span className="text-xs text-muted-foreground">Bank transfer payments awaiting review</span>
          </div>
          <div className="space-y-4">
            {pendingVerifications.map((pv) => (
              <div key={pv.paymentId} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-foreground">{pv.guestName}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{pv.referenceId}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-foreground text-lg">${pv.totalPrice.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(pv.checkIn).toLocaleDateString()} - {new Date(pv.checkOut).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3 border border-border space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {pv.verificationMethod === 'TRANSACTION_ID' ? 'Transaction ID' : 'Payment Link'}
                  </div>
                  <div className="text-sm font-mono text-foreground break-all">
                    {pv.verificationMethod === 'PAYMENT_LINK' ? (
                      <a href={pv.verificationData} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        {pv.verificationData} <ExternalLink size={12} />
                      </a>
                    ) : (
                      pv.verificationData
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                  <button
                    onClick={() => handleVerifyPayment(pv.paymentId, 'CONFIRM')}
                    disabled={actionLoading === pv.paymentId}
                    className="px-4 py-2 bg-success hover:bg-success/80 text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {actionLoading === pv.paymentId ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck size={14} />}
                    Confirm Payment
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm(`Reject payment from ${pv.guestName}? This will cancel the reservation.`)) {
                        handleVerifyPayment(pv.paymentId, 'REJECT')
                      }
                    }}
                    disabled={actionLoading === pv.paymentId}
                    className="px-4 py-2 bg-destructive hover:bg-destructive/80 text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Arrivals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <ConciergeBell size={18} className="text-primary" />
              <span>Arrivals Today ({arrivals.length})</span>
            </h2>
            <span className="text-xs text-muted-foreground">Guests checking in</span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {arrivals.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                No arrivals scheduled for today.
              </div>
            ) : (
              arrivals.map((booking) => {
                const roomInfo = booking.rooms?.[0]?.room
                return (
                  <div 
                    key={booking.id} 
                    className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-foreground">{booking.guestName}</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{booking.referenceId}</p>
                      </div>
                      {roomInfo ? (
                        <div className="bg-primary-light text-primary font-mono font-bold px-3 py-1 rounded-lg text-sm text-right">
                          Room {roomInfo.roomNumber}
                        </div>
                      ) : (
                        <div className="bg-destructive/10 text-destructive font-bold px-3 py-1 rounded-lg text-xs">
                          Unassigned Room
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="flex items-center gap-1.5"><Mail size={12} /> {booking.guestEmail}</p>
                      {booking.guestPhone && <p className="flex items-center gap-1.5"><Phone size={12} /> {booking.guestPhone}</p>}
                    </div>

                    {booking.specialRequests && (
                      <div className="bg-muted rounded-lg p-2.5 text-xs text-foreground/80 border border-border italic">
                        &quot;{booking.specialRequests}&quot;
                      </div>
                    )}

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
                      <div className="text-xs flex items-center gap-1.5 font-semibold text-muted-foreground">
                        <span>Invoice:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${
                          booking.payment?.status === 'COMPLETED' 
                            ? 'bg-success/10 text-success border-success/20' 
                            : 'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          {booking.payment?.status || 'PENDING'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/dashboard/bookings/${booking.id}`} 
                          className="px-3 py-1.5 border border-border hover:bg-muted text-xs font-semibold rounded-md transition-colors"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'CHECKED_IN')}
                          disabled={actionLoading === booking.id || !roomInfo}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-primary-foreground text-xs font-semibold rounded-md shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {actionLoading === booking.id && <Loader2 className="h-3 w-3 animate-spin" />}
                          <span>Check In</span>
                        </button>
                        {['CONFIRMED', 'PENDING'].includes(booking.status) && (
                          <button
                            onClick={async () => {
                              if (await confirm(`Mark ${booking.guestName} as NO-SHOW? This will cancel the reservation and release the room.`)) {
                                handleUpdateStatus(booking.id, 'NO_SHOW')
                              }
                            }}
                            disabled={actionLoading === booking.id}
                            className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                          >
                            No-Show
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Departures */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <LogOut size={18} className="text-success" />
              <span>Departures Today ({departures.length})</span>
            </h2>
            <span className="text-xs text-muted-foreground">Guests checking out</span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {departures.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                No departures scheduled for today.
              </div>
            ) : (
              departures.map((booking) => {
                const roomInfo = booking.rooms?.[0]?.room
                const isPaid = booking.payment?.status === 'COMPLETED'
                
                return (
                  <div 
                    key={booking.id} 
                    className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-foreground">{booking.guestName}</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{booking.referenceId}</p>
                      </div>
                      {roomInfo && (
                        <div className="bg-success/10 text-success font-mono font-bold px-3 py-1 rounded-lg text-sm text-right">
                          Room {roomInfo.roomNumber}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="flex items-center gap-1.5"><Mail size={12} /> {booking.guestEmail}</p>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
                      <div className="text-xs flex items-center gap-1.5 font-semibold text-muted-foreground">
                        <span>Invoice:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${
                          isPaid 
                            ? 'bg-success/10 text-success border-success/20' 
                            : 'bg-destructive/10 text-destructive border-destructive/20 flex items-center gap-1'
                        }`}>
                          {!isPaid && <AlertTriangle size={10} />}
                          {booking.payment?.status || 'PENDING'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/dashboard/bookings/${booking.id}`} 
                          className="px-3 py-1.5 border border-border hover:bg-muted text-xs font-semibold rounded-md transition-colors"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'CHECKED_OUT', 'COMPLETED')}
                          disabled={actionLoading === booking.id}
                          className="px-3 py-1.5 bg-success hover:bg-success/80 text-white text-xs font-semibold rounded-md shadow transition-colors disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {actionLoading === booking.id && <Loader2 className="h-3 w-3 animate-spin" />}
                          <span>Check Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
      {dialog}
    </div>
  )
}
