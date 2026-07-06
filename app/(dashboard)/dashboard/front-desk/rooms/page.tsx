'use client'

import { useEffect, useState } from 'react'
import { 
  ArrowLeft,
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Sparkles,
  CheckCircle,
  Hammer,
  AlertTriangle,
  FlameKindling,
  ConciergeBell
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

export default function FrontDeskRoomBoard() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchRooms = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/rooms')
      if (!res.ok) throw new Error('Failed to load room board')
      const data = await res.json()
      setRooms(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleUpdateStatus = async (roomId: string, status: string) => {
    try {
      const res = await fetch(`/api/dashboard/rooms?id=${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update status')
      }

      fetchRooms()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-success/10 border-success/20 text-success'
      case 'OCCUPIED':
        return 'bg-destructive/10 border-destructive/20 text-destructive'
      case 'RESERVED':
        return 'bg-info/10 border-info/20 text-info'
      case 'DIRTY':
        return 'bg-warning/10 border-warning/20 text-warning'
      case 'MAINTENANCE':
        return 'bg-muted border-border text-muted-foreground'
      case 'CLEAN':
        return 'bg-success/10 border-success/20 text-success'
      default:
        return 'bg-muted border-border text-muted-foreground'
    }
  }

  if (loading && rooms.length === 0) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Count rooms by status
  const counts = rooms.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <Link 
            href="/dashboard/front-desk" 
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to Front Desk Today
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Room Housekeeping & Board</h1>
          <p className="text-sm text-muted-foreground">Live grid showing physical room cleanliness and occupancy status.</p>
        </div>
        
        <button 
          onClick={fetchRooms}
          className="p-2.5 bg-card border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors self-end sm:self-center"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {[
          { label: 'Available', key: 'AVAILABLE', bg: 'bg-success/10 text-success border-success/20/50' },
          { label: 'Occupied', key: 'OCCUPIED', bg: 'bg-destructive/10 text-destructive border-destructive/20/50' },
          { label: 'Reserved', key: 'RESERVED', bg: 'bg-info/10 text-info border-info/20/50' },
          { label: 'Dirty', key: 'DIRTY', bg: 'bg-warning/10 text-warning border-warning/20/50' },
          { label: 'Clean (Ready)', key: 'CLEAN', bg: 'bg-success/10 text-success border-success/20/50' },
          { label: 'Maintenance', key: 'MAINTENANCE', bg: 'bg-muted text-muted-foreground border-border' },
        ].map(stat => (
          <div key={stat.key} className={`border rounded-xl p-4 text-center shadow-sm ${stat.bg}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">{stat.label}</span>
            <span className="text-2xl font-bold block mt-1">{counts[stat.key] || 0}</span>
          </div>
        ))}
      </div>

      {/* Grid of rooms */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {rooms.map((room) => (
          <div 
            key={room.id} 
            className={`border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between ${getStatusColor(room.status)}`}
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-2xl font-extrabold font-mono tracking-tight">{room.roomNumber}</span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border border-current bg-background/70">
                  {room.status}
                </span>
              </div>
              <p className="text-[11px] font-medium opacity-80 mt-1 truncate">{room.roomType.name}</p>
            </div>

            {/* Quick clean/maintenance/release actions */}
            <div className="mt-6 pt-3 border-t border-ink/10 flex items-center justify-between gap-1 text-[10px]">
              {room.status === 'DIRTY' && (
                <button
                  onClick={() => handleUpdateStatus(room.id, 'CLEAN')}
                  className="flex items-center gap-1.5 font-bold hover:underline py-1"
                >
                  <Sparkles size={12} />
                  <span>Mark Clean</span>
                </button>
              )}
              {room.status === 'CLEAN' && (
                <button
                  onClick={() => handleUpdateStatus(room.id, 'AVAILABLE')}
                  className="flex items-center gap-1.5 font-bold hover:underline py-1"
                >
                  <CheckCircle size={12} />
                  <span>Release Room</span>
                </button>
              )}
              {room.status === 'AVAILABLE' && (
                <button
                  onClick={() => handleUpdateStatus(room.id, 'MAINTENANCE')}
                  className="flex items-center gap-1.5 font-bold hover:underline py-1 text-slate-500"
                >
                  <Hammer size={12} />
                  <span>Maintenance</span>
                </button>
              )}
              {room.status === 'MAINTENANCE' && (
                <button
                  onClick={() => handleUpdateStatus(room.id, 'DIRTY')}
                  className="flex items-center gap-1.5 font-bold hover:underline py-1 text-amber-700"
                >
                  <RefreshCw size={12} />
                  <span>Send to Cleaning</span>
                </button>
              )}
              {['OCCUPIED', 'RESERVED'].includes(room.status) && (
                <span className="text-[9px] opacity-65 font-medium italic">Active guest stay</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
