'use client'

import { useEffect, useState } from 'react'
import { 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign,
  Plus,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ConciergeBell,
  CalendarDays,
  KeyRound
} from 'lucide-react'
import Link from 'next/link'
import { formatDualPriceCompact, fetchEtbRate } from '@/lib/dual-pricing'

interface Booking {
  id: string
  referenceId: string
  guestName: string
  guestEmail: string
  checkIn: string
  checkOut: string
  status: string
  totalPrice: number
  paymentMethod: string
  createdAt: string
  rooms: {
    room: {
      roomNumber: string
      roomType: {
        name: string
      }
    }
  }[]
}

interface DashboardStats {
  arrivals: number
  departures: number
  occupancyRate: number
  revenueToday: number
  totalRooms: number
  occupiedRooms: number
  recentBookings: Booking[]
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [etbRate, setEtbRate] = useState(120)

  useEffect(() => {
    fetchEtbRate().then(setEtbRate)
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) throw new Error('Failed to fetch dashboard statistics')
      const data = await res.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
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

  if (loading && !stats) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard overview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button 
          onClick={fetchStats}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/95 transition-all"
        >
          <RefreshCw size={16} />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{getGreeting()}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Here is a snapshot of Eset Hotel operations today.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={fetchStats}
            className="inline-flex items-center justify-center p-2.5 bg-background border border-border text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link 
            href="/dashboard/bookings" 
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-all shadow-sm flex-1 sm:flex-none"
          >
            <Plus size={16} />
            <span>Create Booking</span>
          </Link>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Arrivals Card */}
        <div className="bg-card rounded-xl border border-border p-5 md:p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arrivals Today</span>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{stats?.arrivals}</p>
            <span className="text-[10px] md:text-xs text-success font-medium">Expected check-ins</span>
          </div>
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-success/10 flex items-center justify-center text-success flex-shrink-0">
            <ArrowRight size={18} className="md:hidden" />
            <ArrowRight size={20} className="hidden md:block" />
          </div>
        </div>

        {/* Departures Card */}
        <div className="bg-card rounded-xl border border-border p-5 md:p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departures Today</span>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{stats?.departures}</p>
            <span className="text-[10px] md:text-xs text-warning font-medium">Expected check-outs</span>
          </div>
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-warning/10 flex items-center justify-center text-warning flex-shrink-0">
            <Clock size={18} className="md:hidden" />
            <Clock size={20} className="hidden md:block" />
          </div>
        </div>

        {/* Occupancy Card */}
        <div className="bg-card rounded-xl border border-border p-5 md:p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupancy Rate</span>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{stats?.occupancyRate}%</p>
            <span className="text-[10px] md:text-xs text-muted-foreground font-medium">
              {stats?.occupiedRooms} of {stats?.totalRooms} rooms
            </span>
          </div>
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-primary-light flex items-center justify-center text-primary flex-shrink-0">
            <Users size={18} className="md:hidden" />
            <Users size={20} className="hidden md:block" />
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-card rounded-xl border border-border p-5 md:p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Revenue Today</span>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              ${stats?.revenueToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] md:text-xs text-muted-foreground font-medium">Stripe + Walk-in</span>
          </div>
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-primary-light flex items-center justify-center text-primary flex-shrink-0">
            <DollarSign size={18} className="md:hidden" />
            <DollarSign size={20} className="hidden md:block" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Bookings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Bookings - Responsive: Table on desktop, Cards on mobile */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm sm:text-base">Recent Bookings</h2>
            <Link 
              href="/dashboard/bookings" 
              className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
            >
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                  <th className="px-4 sm:px-6 py-3">Guest / Reference</th>
                  <th className="px-4 sm:px-6 py-3">Room</th>
                  <th className="px-4 sm:px-6 py-3">Dates</th>
                  <th className="px-4 sm:px-6 py-3">Total</th>
                  <th className="px-4 sm:px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {stats?.recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  stats?.recentBookings.map((booking) => {
                    const roomInfo = booking.rooms?.[0]?.room
                    const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    
                    return (
                      <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <div>
                            <p className="font-semibold text-foreground">{booking.guestName}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{booking.referenceId}</p>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          {roomInfo ? (
                            <div>
                              <p className="font-medium text-foreground/80">Room {roomInfo.roomNumber}</p>
                              <p className="text-xs text-muted-foreground">{roomInfo.roomType.name}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {checkInDate} – {checkOutDate}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-semibold text-foreground">
                          ${booking.totalPrice.toFixed(2)}
                          <div className="text-[10px] font-mono text-muted-foreground">≈ {formatDualPriceCompact(booking.totalPrice, etbRate)}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          {getStatusBadge(booking.status)}
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
            {stats?.recentBookings.length === 0 ? (
              <div className="px-4 py-10 text-center text-slate-400 text-sm">
                No bookings found.
              </div>
            ) : (
              stats?.recentBookings.map((booking) => {
                const roomInfo = booking.rooms?.[0]?.room
                const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                
                return (
                  <div key={booking.id} className="px-4 py-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{booking.guestName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{booking.referenceId}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-right">
                          <p className="font-semibold text-foreground text-sm">${booking.totalPrice.toFixed(2)}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">≈ {formatDualPriceCompact(booking.totalPrice, etbRate)}</p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      {roomInfo ? (
                        <>
                          <span>Room {roomInfo.roomNumber}</span>
                          <span>·</span>
                          <span>{roomInfo.roomType.name}</span>
                        </>
                      ) : (
                        <span>Unassigned</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {checkInDate} – {checkOutDate}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Quick Operations Sidebar */}
        <div className="space-y-4 md:space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-foreground text-sm sm:text-base">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link 
                href="/dashboard/front-desk" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/50 hover:bg-muted hover:border-border transition-all group"
              >
                <div className="h-9 w-9 rounded bg-primary-light text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ConciergeBell size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Front Desk Board</p>
                  <p className="text-[10px] text-muted-foreground">Arrivals/departures & check-in</p>
                </div>
              </Link>

              <Link 
                href="/dashboard/calendar" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/50 hover:bg-muted hover:border-border transition-all group"
              >
                <div className="h-9 w-9 rounded bg-warning/10 text-warning flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarDays size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Booking Calendar</p>
                  <p className="text-[10px] text-muted-foreground">Visualize rooms and stays</p>
                </div>
              </Link>

              <Link 
                href="/dashboard/rooms" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/50 hover:bg-muted hover:border-border transition-all group"
              >
                <div className="h-9 w-9 rounded bg-success/10 text-success flex items-center justify-center group-hover:scale-105 transition-transform">
                  <KeyRound size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">Room Statuses</p>
                  <p className="text-[10px] text-muted-foreground">Clean, dirty, maintenance</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-ink text-primary-foreground rounded-xl p-5 md:p-6 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-10 font-bold text-8xl md:text-9xl">
              ESET
            </div>
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <span>Admin Portal</span>
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Staff and admins can manage real-time inventory, configure rooms, issue promo codes, and track guest stays.
            </p>
            <div className="text-xs text-white/60 font-medium pt-1.5 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span>All systems online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
