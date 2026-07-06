'use client'

import { useEffect, useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  ArrowRight,
  Info
} from 'lucide-react'
import Link from 'next/link'

interface RoomType {
  name: string
}

interface Room {
  id: string
  roomNumber: string
  status: string
  roomType: RoomType
}

interface BookingRoom {
  roomId: string
}

interface Booking {
  id: string
  referenceId: string
  guestName: string
  checkIn: string
  checkOut: string
  status: string
  rooms: BookingRoom[]
}

export default function BookingCalendar() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Calendar view parameters
  const [baseDate, setBaseDate] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  // Generate 14 days from baseDate
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(baseDate)
    d.setDate(baseDate.getDate() + i)
    return d
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const startDateStr = baseDate.toISOString().split('T')[0]
      const end = new Date(baseDate)
      end.setDate(baseDate.getDate() + 14)
      const endDateStr = end.toISOString().split('T')[0]

      const [roomsRes, bookingsRes] = await Promise.all([
        fetch('/api/dashboard/rooms'),
        fetch(`/api/dashboard/bookings?startDate=${startDateStr}&endDate=${endDateStr}`)
      ])

      if (!roomsRes.ok || !bookingsRes.ok) {
        throw new Error('Failed to load calendar data')
      }

      const roomsData = await roomsRes.json()
      const bookingsData = await bookingsRes.json()

      setRooms(roomsData)
      setBookings(bookingsData)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [baseDate])

  const handlePrev = () => {
    setBaseDate(prev => {
      const d = new Date(prev)
      d.setDate(prev.getDate() - 7)
      return d
    })
  }

  const handleNext = () => {
    setBaseDate(prev => {
      const d = new Date(prev)
      d.setDate(prev.getDate() + 7)
      return d
    })
  }

  const handleToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setBaseDate(d)
  }

  const getBookingForRoomAndDay = (roomId: string, date: Date) => {
    return bookings.find(b => {
      const isRoomAssigned = b.rooms.some(r => r.roomId === roomId)
      if (!isRoomAssigned) return false

      const checkInDate = new Date(b.checkIn)
      const checkOutDate = new Date(b.checkOut)
      
      // Set hours to 0 to compare days properly
      const checkInZero = new Date(checkInDate.setHours(0,0,0,0))
      const checkOutZero = new Date(checkOutDate.setHours(0,0,0,0))
      const dateZero = new Date(date.setHours(0,0,0,0))

      return dateZero >= checkInZero && dateZero < checkOutZero
    })
  }

  const getBookingStatusStyle = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return 'bg-warning text-white hover:bg-warning/90'
      case 'CHECKED_OUT':
        return 'bg-muted-foreground/70 text-white hover:bg-muted-foreground'
      case 'CONFIRMED':
        return 'bg-success text-white hover:bg-success/90'
      default:
        return 'bg-info text-white hover:bg-info/90'
    }
  }

  if (loading && rooms.length === 0) {
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
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Booking Calendar</h1>
          <p className="text-sm text-muted-foreground">Live operational room allocations grid for staff reference.</p>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1 shadow-sm text-xs">
          <button 
            onClick={handlePrev}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={handleToday}
            className="px-3 py-1.5 hover:bg-muted rounded font-semibold text-foreground transition-colors"
          >
            Today
          </button>
          <button 
            onClick={handleNext}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend & Summary */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-foreground flex items-center gap-1.5"><Info size={14} /> Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-success"></span>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-warning"></span>
            <span>Checked In</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-muted-foreground/50"></span>
            <span>Checked Out</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-info"></span>
            <span>Pending/Other</span>
          </div>
        </div>
        <div className="font-semibold text-foreground/70">
          Showing: {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {days[13].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full border-collapse">
            <thead>
              {/* Date headers */}
              <tr className="bg-muted border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[150px] sticky left-0 bg-muted border-r border-border z-10">
                  Room
                </th>
                {days.map((day, idx) => {
                  const isTodayStr = new Date().toDateString() === day.toDateString()
                  return (
                    <th 
                      key={idx} 
                      className={`px-2 py-3 text-center border-r border-border min-w-[75px] ${
                        isTodayStr ? 'bg-primary-light text-primary font-bold' : 'text-muted-foreground font-semibold'
                      }`}
                    >
                      <span className="block text-[10px] uppercase tracking-wider">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <span className="block text-sm mt-0.5">{day.getDate()}</span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-6 py-10 text-center text-muted-foreground">
                    No physical rooms configured in database.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                    {/* Room details header */}
                    <td className="px-4 py-3.5 font-semibold text-foreground border-r border-border sticky left-0 bg-card shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10">
                      <div>
                        <span className="text-sm font-bold font-mono">Room {room.roomNumber}</span>
                        <span className="block text-[10px] text-muted-foreground font-normal mt-0.5 truncate">{room.roomType.name}</span>
                      </div>
                    </td>

                    {/* Date cells */}
                    {days.map((day, idx) => {
                      const bookingCell = getBookingForRoomAndDay(room.id, day)
                      const isTodayStr = new Date().toDateString() === day.toDateString()

                      return (
                        <td 
                          key={idx} 
                          className={`p-1.5 text-center border-r border-border align-middle ${
                            isTodayStr ? 'bg-primary-light/30' : ''
                          }`}
                        >
                          {bookingCell ? (
                            <Link
                              href={`/dashboard/bookings/${bookingCell.id}`}
                              className={`block p-2 rounded-lg text-[10px] font-bold leading-tight select-none shadow-sm transition-all hover:scale-[1.02] truncate ${getBookingStatusStyle(bookingCell.status)}`}
                              title={`${bookingCell.guestName} (${bookingCell.referenceId})`}
                            >
                              <span className="block truncate">{bookingCell.guestName.split(' ')[0]}</span>
                              <span className="block opacity-85 font-mono font-medium mt-0.5 text-[8px]">{bookingCell.referenceId}</span>
                            </Link>
                          ) : (
                            <div className="h-9 w-full flex items-center justify-center text-muted-foreground/30">
                              –
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
