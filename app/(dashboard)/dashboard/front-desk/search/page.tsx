'use client'

import { useState } from 'react'
import { 
  Search, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  User, 
  Mail, 
  Eye, 
  ArrowLeft,
  ConciergeBell
} from 'lucide-react'
import Link from 'next/link'

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
  checkIn: string
  checkOut: string
  status: string
  totalPrice: number
  payment: {
    status: string
  } | null
  rooms: BookingRoom[]
}

export default function FrontDeskSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Booking[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setHasSearched(true)
    try {
      const res = await fetch(`/api/dashboard/bookings?search=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Search failed. Please try again.')
      const data = await res.json()
      setResults(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-success/10 text-success border-success/20">Confirmed</span>
      case 'CHECKED_IN':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-warning/10 text-warning border-warning/20">Checked In</span>
      case 'CHECKED_OUT':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-foreground/80 border border-slate-200/50">Checked Out</span>
      case 'CANCELLED':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-destructive/10 text-destructive border-destructive/20">Cancelled</span>
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-info/10 text-info border-info/20">{status}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Back to Front Desk */}
      <Link 
        href="/dashboard/front-desk" 
        className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} /> Back to Front Desk Board
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Find Reservation</h1>
        <p className="text-sm text-muted-foreground">Quickly search bookings by guest name, email, or ESET reference code.</p>
      </div>

      {/* Search Input Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter name, email address, or reference ID (e.g. ESET-XYZ)..."
              className="w-full pl-10 pr-4 py-3 text-sm rounded-lg border border-border bg-muted focus:bg-background focus:border-primary focus:outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Search</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider">Search Results ({results.length})</h2>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : results.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
              No matching reservations found. Please verify details.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((booking) => {
                const roomInfo = booking.rooms?.[0]?.room
                const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                
                return (
                  <div 
                    key={booking.id}
                    className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-foreground">{booking.guestName}</h3>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{booking.referenceId}</p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1.5"><Mail size={12} /> {booking.guestEmail}</p>
                        <p className="flex items-center gap-1.5"><Calendar size={12} /> {checkInDate} – {checkOutDate}</p>
                      </div>

                      {roomInfo && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted text-foreground/80 text-xs font-semibold border border-border/50">
                          Room {roomInfo.roomNumber} • {roomInfo.roomType.name}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-3.5 flex justify-between items-center">
                      <span className="text-sm font-bold text-foreground">${booking.totalPrice.toFixed(2)}</span>
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <span>Open Details</span>
                        <Eye size={14} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
