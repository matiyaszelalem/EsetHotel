'use client'

import { useEffect, useState } from 'react'
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar as CalendarIcon, 
  Eye, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  Phone,
  Mail,
  User,
  ConciergeBell
} from 'lucide-react'
import Link from 'next/link'
import { formatDualPriceCompact, fetchEtbRate } from '@/lib/dual-pricing'

interface RoomType {
  id: string
  name: string
  basePrice: number
}

interface Booking {
  id: string
  referenceId: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  checkIn: string
  checkOut: string
  status: string
  totalPrice: number
  paymentMethod: string
  source: string
  createdAt: string
  payment: {
    status: string
  } | null
  rooms: {
    room: {
      roomNumber: string
      roomType: {
        name: string
      }
    }
  }[]
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [etbRate, setEtbRate] = useState(120)

  useEffect(() => {
    fetchEtbRate().then(setEtbRate)
  }, [])

  // Search & Filter State
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Create Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [newBooking, setNewBooking] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    specialRequests: '',
    checkIn: '',
    checkOut: '',
    guests: '1',
    roomTypeId: '',
    paymentMethod: 'PAY_AT_HOTEL',
    paymentStatus: 'PENDING',
    source: 'WALK_IN',
  })

  const fetchBookings = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const res = await fetch(`/api/dashboard/bookings?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const data = await res.json()
      setBookings(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      const res = await fetch('/api/dashboard/room-types')
      if (res.ok) {
        const data = await res.json()
        setRoomTypes(data)
        if (data.length > 0) {
          setNewBooking(prev => ({ ...prev, roomTypeId: data[0].id }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch room types:', err)
    }
  }

  useEffect(() => {
    fetchBookings()
    fetchRoomTypes()
  }, [statusFilter, startDate, endDate])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBookings()
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    setModalError('')
    try {
      const res = await fetch('/api/dashboard/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create booking')

      setIsModalOpen(false)
      // Reset form
      setNewBooking({
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        specialRequests: '',
        checkIn: '',
        checkOut: '',
        guests: '1',
        roomTypeId: roomTypes[0]?.id || '',
        paymentMethod: 'PAY_AT_HOTEL',
        paymentStatus: 'PENDING',
        source: 'WALK_IN',
      })
      fetchBookings()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred')
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string, paymentStatus?: string) => {
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

      fetchBookings()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-success/10 text-success border-success/20'
      case 'CHECKED_IN':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'CHECKED_OUT':
        return 'bg-muted text-muted-foreground border-border/50'
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-info/10 text-info border-info/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Bookings Directory</h1>
          <p className="text-sm text-muted-foreground">Manage online, OTA, and front-desk walk-in reservations.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <Plus size={16} />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] relative">
            <input
              type="text"
              placeholder="Search by name, email, or ESET reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-muted border border-border rounded-lg outline-none focus:bg-background focus:border-primary transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          </form>

          {/* Status filter */}
          <div className="flex items-center gap-2 bg-muted border border-border rounded-lg p-1">
            {['ALL', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                  statusFilter === st 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Check-In GTE:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-muted border border-border rounded px-2.5 py-1 text-foreground outline-none focus:bg-background focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Check-Out LTE:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-muted border border-border rounded px-2.5 py-1 text-foreground outline-none focus:bg-background focus:border-primary transition-all"
            />
          </div>
          {(startDate || endDate || searchQuery) && (
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
                setSearchQuery('')
                setStatusFilter('ALL')
              }}
              className="text-destructive hover:text-destructive/80 font-medium ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table - Desktop */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Reference & Date</th>
                <th className="px-6 py-3.5">Guest details</th>
                <th className="px-6 py-3.5">Room & Dates</th>
                <th className="px-6 py-3.5">Amount & Payment</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Loading bookings...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No reservations matching selected criteria.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const roomAssignment = booking.rooms?.[0]?.room
                  const checkIn = new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  const checkOut = new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  const created = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                  return (
                    <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground font-mono text-xs">{booking.referenceId}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Booked {created}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">{booking.guestName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Mail size={12} /> {booking.guestEmail}</p>
                          {booking.guestPhone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone size={12} /> {booking.guestPhone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {roomAssignment ? (
                          <div>
                            <p className="font-medium text-foreground/80">Room {roomAssignment.roomNumber}</p>
                            <p className="text-xs text-muted-foreground">{roomAssignment.roomType.name}</p>
                            <p className="text-xs text-primary mt-1 font-medium">{checkIn} – {checkOut}</p>
                          </div>
                        ) : (
                          <div>
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border">Unassigned</span>
                            <p className="text-xs text-primary mt-1.5 font-medium">{checkIn} – {checkOut}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">${booking.totalPrice.toFixed(2)}</p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">≈ {formatDualPriceCompact(booking.totalPrice, etbRate)}</p>
                          <div className="mt-1 flex items-center gap-1.5 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                              booking.payment?.status === 'COMPLETED' 
                                ? 'bg-success/10 text-success border-success/20' 
                                : 'bg-warning/10 text-warning border-warning/20'
                            }`}>
                              {booking.payment?.status || 'PENDING'}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">({booking.paymentMethod})</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(booking.status)}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'CHECKED_IN')}
                              className="p-1.5 text-warning hover:bg-warning/10 rounded-lg transition-colors border border-transparent hover:border-warning/20"
                              title="Check In"
                            >
                              <ConciergeBell size={16} />
                            </button>
                          )}
                          {booking.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'CHECKED_OUT', 'COMPLETED')}
                              className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors border border-transparent hover:border-success/20"
                              title="Check Out"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {['CONFIRMED', 'PENDING'].includes(booking.status) && (
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this booking?')) {
                                  handleUpdateStatus(booking.id, 'CANCELLED')
                                }
                              }}
                              className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                              title="Cancel Reservation"
                            >
                              <X size={16} />
                            </button>
                          )}
                          <Link
                            href={`/dashboard/bookings/${booking.id}`}
                            className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden divide-y divide-border">
          {loading ? (
            <div className="px-4 py-12 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading bookings...</span>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              No reservations matching selected criteria.
            </div>
          ) : (
            bookings.map((booking) => {
              const roomAssignment = booking.rooms?.[0]?.room
              const checkIn = new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const checkOut = new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const created = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

              return (
                <div key={booking.id} className="px-4 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground font-mono text-xs">{booking.referenceId}</p>
                      <p className="text-[10px] text-muted-foreground">Booked {created}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusStyle(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{booking.guestName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{booking.guestEmail}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground">
                      {roomAssignment ? (
                        <span>Room {roomAssignment.roomNumber} · {roomAssignment.roomType.name}</span>
                      ) : (
                        <span>Unassigned</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground text-sm">${booking.totalPrice.toFixed(2)}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">≈ {formatDualPriceCompact(booking.totalPrice, etbRate)}</p>
                      <p className={`text-[10px] font-semibold ${booking.payment?.status === 'COMPLETED' ? 'text-success' : 'text-warning'}`}>
                        {booking.payment?.status || 'PENDING'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-primary font-medium">{checkIn} – {checkOut}</p>
                    <div className="flex items-center gap-2">
                      {booking.status === 'CONFIRMED' && (
                        <button onClick={() => handleUpdateStatus(booking.id, 'CHECKED_IN')} className="p-1.5 text-warning hover:bg-warning/10 rounded-lg transition-colors" title="Check In">
                          <ConciergeBell size={14} />
                        </button>
                      )}
                      {booking.status === 'CHECKED_IN' && (
                        <button onClick={() => handleUpdateStatus(booking.id, 'CHECKED_OUT', 'COMPLETED')} className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors" title="Check Out">
                          <Check size={14} />
                        </button>
                      )}
                      {['CONFIRMED', 'PENDING'].includes(booking.status) && (
                        <button onClick={() => { if (confirm('Cancel this booking?')) handleUpdateStatus(booking.id, 'CANCELLED') }} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Cancel">
                          <X size={14} />
                        </button>
                      )}
                      <Link href={`/dashboard/bookings/${booking.id}`} className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                        <Eye size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Create Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-xl max-w-2xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-foreground">New Walk-in Reservation</h3>
                <p className="text-xs text-muted-foreground">Direct bookings created from the hotel front desk.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="flex-1 overflow-y-auto p-6 space-y-5">
              {modalError && (
                <div className="flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Guest Name</label>
                  <input
                    type="text"
                    required
                    value={newBooking.guestName}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, guestName: e.target.value }))}
                    placeholder="Matiyas Zelalem"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Guest Email</label>
                  <input
                    type="email"
                    required
                    value={newBooking.guestEmail}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, guestEmail: e.target.value }))}
                    placeholder="matiyas@gmail.com"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Guest Phone (Optional)</label>
                  <input
                    type="tel"
                    value={newBooking.guestPhone}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, guestPhone: e.target.value }))}
                    placeholder="+251 911 00 00 00"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Number of Guests</label>
                  <select
                    value={newBooking.guests}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, guests: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} Guests</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Check-in Date</label>
                  <input
                    type="date"
                    required
                    value={newBooking.checkIn}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Check-out Date</label>
                  <input
                    type="date"
                    required
                    value={newBooking.checkOut}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Room Category</label>
                  <select
                    value={newBooking.roomTypeId}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, roomTypeId: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  >
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name} (${rt.basePrice}/night)</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Method</label>
                  <select
                    value={newBooking.paymentMethod}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  >
                    <option value="PAY_AT_HOTEL">Pay at Hotel</option>
                    <option value="CASH">Cash</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Payment Status</label>
                  <select
                    value={newBooking.paymentStatus}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  >
                    <option value="PENDING">Pending (Unpaid)</option>
                    <option value="COMPLETED">Completed (Paid)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Source</label>
                  <select
                    value={newBooking.source}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  >
                    <option value="WALK_IN">Walk-In</option>
                    <option value="DIRECT">Phone Reservation</option>
                    <option value="OTA">OTA (External)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Special Requests</label>
                <textarea
                  value={newBooking.specialRequests}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Need extra pillows, early check-in, dietary requirements..."
                  rows={3}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 hover:border-primary/50 focus:bg-background focus:border-primary focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                >
                  {modalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Reservation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
