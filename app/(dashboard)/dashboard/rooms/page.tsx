'use client'

import { useEffect, useState } from 'react'
import { 
  Plus, 
  Bed, 
  Trash2, 
  Edit, 
  AlertCircle, 
  Loader2, 
  Check, 
  Settings, 
  Hammer,
  Sparkles,
  RefreshCw,
  FolderOpen,
  Link2
} from 'lucide-react'
import { useConfirm } from '@/hooks/use-confirm'

interface RoomType {
  id: string
  slug: string
  name: string
  description: string
  basePrice: number
  capacity: number
  bedConfig: string
  amenities: string // JSON string
  images: string // JSON string
}

interface Room {
  id: string
  roomNumber: string
  roomTypeId: string
  status: string
  roomType: RoomType
}

export default function RoomsManagement() {
  const { confirm, dialog } = useConfirm()
  const [activeTab, setActiveTab] = useState<'categories' | 'rooms'>('rooms')
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // New Category form state
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    basePrice: '',
    capacity: 2,
    bedConfig: '1 King Bed',
    amenities: '', // comma separated
  })

  // iCal Import state
  const [icalUrls, setIcalUrls] = useState<Record<string, string>>({})
  const [icalSyncing, setIcalSyncing] = useState(false)
  const [icalLoading, setIcalLoading] = useState<Record<string, boolean>>({})
  const [icalResults, setIcalResults] = useState<string | null>(null)

  // New Room form state
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    roomTypeId: '',
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [typesRes, roomsRes] = await Promise.all([
        fetch('/api/dashboard/room-types'),
        fetch('/api/dashboard/rooms')
      ])

      if (!typesRes.ok || !roomsRes.ok) {
        throw new Error('Failed to load room inventory data')
      }

      const typesData = await typesRes.json()
      const roomsData = await roomsRes.json()

      setRoomTypes(typesData)
      setRooms(roomsData)

      if (typesData.length > 0) {
        setNewRoom(prev => ({ ...prev, roomTypeId: typesData[0].id }))
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (roomTypes.length > 0) {
      const urls: Record<string, string> = {}
      roomTypes.forEach((rt) => {
        urls[rt.id] = (rt as any).icalImportUrl || ''
      })
      setIcalUrls(urls)
    }
  }, [roomTypes])

  const handleSaveIcalUrl = async (roomTypeId: string) => {
    setIcalLoading(prev => ({ ...prev, [roomTypeId]: true }))
    try {
      const res = await fetch('/api/ical/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId,
          icalUrl: icalUrls[roomTypeId],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save iCal URL')
      alert(`Imported ${data.imported} bookings, skipped ${data.skipped}`)
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    } finally {
      setIcalLoading(prev => ({ ...prev, [roomTypeId]: false }))
    }
  }

  const handleSyncAll = async () => {
    setIcalSyncing(true)
    setIcalResults(null)
    try {
      const res = await fetch('/api/ical/import/sync')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Sync failed')
      setIcalResults(`Synced ${data.synced} room types. Total imported: ${data.results.reduce((a: number, r: any) => a + r.imported, 0)}`)
      fetchData()
    } catch (err: any) {
      setIcalResults(`Sync error: ${err.message}`)
    } finally {
      setIcalSyncing(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    setModalError('')
    try {
      const amenitiesArray = newCategory.amenities
        .split(',')
        .map(a => a.trim())
        .filter(Boolean)

      const res = await fetch('/api/dashboard/room-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCategory,
          amenities: amenitiesArray,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create category')

      setIsCategoryModalOpen(false)
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        basePrice: '',
        capacity: 2,
        bedConfig: '1 King Bed',
        amenities: '',
      })
      fetchData()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred')
    } finally {
      setModalLoading(false)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    setModalError('')
    try {
      const res = await fetch('/api/dashboard/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create physical room')

      setIsRoomModalOpen(false)
      setNewRoom(prev => ({ ...prev, roomNumber: '' }))
      fetchData()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred')
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateRoomStatus = async (roomId: string, status: string) => {
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

      fetchData()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!await confirm('Are you sure you want to delete this room category? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/dashboard/room-types?id=${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete category')
      }
      fetchData()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-success/10 text-success border-success/20'
      case 'OCCUPIED':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      case 'RESERVED':
        return 'bg-info/10 text-info border-info/20'
      case 'DIRTY':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'MAINTENANCE':
        return 'bg-muted text-muted-foreground border-border'
      case 'CLEAN':
        return 'bg-success/10 text-success border-success/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (loading && roomTypes.length === 0) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {icalResults && (
        <div className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
          icalResults.startsWith('Sync error') ? 'bg-destructive/5 border border-destructive/20 text-destructive' : 'bg-success/5 border border-success/20 text-success'
        }`}>
          <span>{icalResults}</span>
          <button onClick={() => setIcalResults(null)} className="ml-auto font-bold">×</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Room Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage hotel rooms, pricing, and live room cleaning/maintenance states.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-2.5 bg-background border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {activeTab === 'categories' && (
            <button
              onClick={handleSyncAll}
              disabled={icalSyncing}
              className="inline-flex items-center gap-2 border border-primary/20 text-primary hover:bg-primary-light px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={icalSyncing ? 'animate-spin' : ''} />
              <span>Sync iCal</span>
            </button>
          )}
          {activeTab === 'categories' ? (
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <Plus size={16} />
              <span>New Category</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRoomModalOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <Plus size={16} />
              <span>Add Physical Room</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-4 text-sm">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`pb-3.5 font-semibold transition-all relative ${
            activeTab === 'rooms' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Physical Rooms Grid ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3.5 font-semibold transition-all relative ${
            activeTab === 'categories' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Room Categories / Rates ({roomTypes.length})
        </button>
      </div>

      {/* TAB 1: Physical Rooms Grid */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Room status board */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {rooms.map((room) => (
              <div 
                key={room.id}
                className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative group"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xl font-bold text-foreground font-mono">{room.roomNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoomStatusColor(room.status)}`}>
                      {room.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{room.roomType.name}</p>
                </div>

                {/* Live actions for staff */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {room.status === 'DIRTY' && (
                    <button
                      onClick={() => handleUpdateRoomStatus(room.id, 'CLEAN')}
                      className="p-1 text-success hover:bg-success/10 rounded"
                      title="Mark Clean"
                    >
                      <Sparkles size={14} />
                    </button>
                  )}
                  {room.status === 'CLEAN' && (
                    <button
                      onClick={() => handleUpdateRoomStatus(room.id, 'AVAILABLE')}
                      className="p-1 text-primary hover:bg-primary/5 rounded"
                      title="Release Room to Available"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  {room.status === 'AVAILABLE' && (
                    <button
                      onClick={() => handleUpdateRoomStatus(room.id, 'MAINTENANCE')}
                      className="p-1 text-muted-foreground hover:bg-muted rounded"
                      title="Out of Service (Maintenance)"
                    >
                      <Hammer size={14} />
                    </button>
                  )}
                  {room.status === 'MAINTENANCE' && (
                    <button
                      onClick={() => handleUpdateRoomStatus(room.id, 'DIRTY')}
                      className="p-1 text-warning hover:bg-warning/10 rounded"
                      title="Set to Dirty (Needs cleaning)"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                  <span className="text-[9px] text-muted-foreground">Quick Change</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Categories / Rates */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roomTypes.map((rt) => {
            const amenities = JSON.parse(rt.amenities || '[]')
            return (
              <div 
                key={rt.id}
                className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{rt.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">slug: {rt.slug}</p>
                    </div>
                    <p className="text-right">
                      <span className="text-xl font-bold text-foreground">${rt.basePrice}</span>
                      <span className="text-muted-foreground text-xs block">/ night</span>
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">{rt.description}</p>
                  
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {amenities.map((amenity: string, idx: number) => (
                      <span 
                        key={idx}
                        className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground border border-border"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">
                      <Link2 size={12} /> iCal Export URL (OTA Sync)
                    </p>
                    <div className="flex gap-2">
                      <input 
                        readOnly 
                        value={typeof window !== 'undefined' ? `${window.location.origin}/api/ical/export/${rt.id}` : ''}
                        className="flex-1 text-[11px] bg-muted border border-border rounded px-2 py-1.5 font-mono text-muted-foreground focus:outline-none"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/api/ical/export/${rt.id}`)
                          alert('iCal URL Copied to clipboard')
                        }}
                        className="px-2 py-1 text-[11px] bg-primary-light text-primary font-semibold rounded border border-primary/20 hover:bg-primary-light/80 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5">
                      <RefreshCw size={12} /> iCal Import URL (OTA Sync)
                    </p>
                    <div className="flex gap-2">
                      <input 
                        value={icalUrls[rt.id] || ''}
                        onChange={(e) => setIcalUrls(prev => ({ ...prev, [rt.id]: e.target.value }))}
                        placeholder="https://example.com/calendar.ics"
                        className="flex-1 text-[11px] bg-background border border-border rounded px-2 py-1.5 font-mono text-foreground focus:outline-none focus:border-primary"
                      />
                      <button 
                        onClick={() => handleSaveIcalUrl(rt.id)}
                        disabled={icalLoading[rt.id]}
                        className="px-2 py-1 text-[11px] bg-success/10 text-success font-semibold rounded border border-success/20 hover:bg-success/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {icalLoading[rt.id] && <RefreshCw size={10} className="animate-spin" />}
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Capacity: <span className="font-semibold text-foreground">{rt.capacity} Guests</span> • Bed config: <span className="font-semibold text-foreground">{rt.bedConfig}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(rt.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20"
                    title="Delete Category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Add Category */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-xl max-w-lg w-full shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-foreground">Add Room Category</h3>
                <p className="text-xs text-muted-foreground">Define a new category of rooms and set its pricing structure.</p>
              </div>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              {modalError && (
                <div className="flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Executive Suite"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Slug</label>
                  <input
                    type="text"
                    required
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/ /g, '-') }))}
                    placeholder="executive-suite"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Base Price / Night ($)</label>
                  <input
                    type="number"
                    required
                    value={newCategory.basePrice}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, basePrice: e.target.value }))}
                    placeholder="350"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Max Guest Capacity</label>
                  <input
                    type="number"
                    required
                    value={newCategory.capacity}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    placeholder="3"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Bed Configuration</label>
                <input
                  type="text"
                  required
                  value={newCategory.bedConfig}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, bedConfig: e.target.value }))}
                  placeholder="1 King Bed, 1 Sofa Bed"
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                <textarea
                  required
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell guests about the room..."
                  rows={2}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Amenities (Comma separated)</label>
                <input
                  type="text"
                  value={newCategory.amenities}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, amenities: e.target.value }))}
                  placeholder="Free Wi-Fi, Ocean View, Mini Bar, Bathtub"
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-60 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  {modalLoading ? 'Creating...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Room */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-xl max-w-sm w-full shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-foreground">Add Physical Room</h3>
                <p className="text-xs text-muted-foreground">Add a physical room number and map it to a category.</p>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
              {modalError && (
                <div className="flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Room Number</label>
                <input
                  type="text"
                  required
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, roomNumber: e.target.value }))}
                  placeholder="304"
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Room Category</label>
                <select
                  value={newRoom.roomTypeId}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, roomTypeId: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary-dark disabled:opacity-60 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  {modalLoading ? 'Saving...' : 'Save Room'}
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
