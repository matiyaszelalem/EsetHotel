'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  Globe, 
  RefreshCw, 
  Sliders, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Key, 
  Plus, 
  Trash2, 
  Loader2, 
  Eye, 
  EyeOff, 
  Database,
  ArrowRight,
  Info,
  ExternalLink,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface Mapping {
  id: string
  channelId: string
  roomTypeId: string
  externalRoomCode: string
  rateCode: string | null
  syncEnabled: boolean
  createdAt: string
  updatedAt: string
}

interface SyncLog {
  id: string
  channelId: string
  channel: { name: string }
  action: string
  status: string
  details: string | null
  itemCount: number
  createdAt: string
}

interface Channel {
  id: string
  name: string
  slug: string
  status: string // DEMO, CONNECTED, DISCONNECTED, ERROR
  apiKey: string | null
  apiSecret: string | null
  config: string | null
  lastSyncAt: string | null
  mappings?: Mapping[]
  _count?: {
    mappings: number
    syncLogs: number
  }
}

interface RoomType {
  id: string
  name: string
  slug: string
  basePrice: number
  icalToken: string
}

export default function ChannelManagerPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [logs, setLogs] = useState<SyncLog[]>([])
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [mappings, setMappings] = useState<Mapping[]>([])
  
  // Action loadings
  const [syncingAll, setSyncingAll] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [addingMapping, setAddingMapping] = useState(false)

  // Modals & Banners
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null)

  // Forms
  const [revealApiFields, setRevealApiFields] = useState(false)
  const [credentialsForm, setCredentialsForm] = useState({
    apiKey: '',
    apiSecret: '',
    status: 'DEMO'
  })
  const [newMappingForm, setNewMappingForm] = useState({
    roomTypeId: '',
    externalRoomCode: '',
    rateCode: ''
  })

  const [rotatingTokenId, setRotatingTokenId] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    channelId: 'ALL',
    status: 'ALL'
  })

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch channels
      const chanRes = await fetch('/api/dashboard/channels')
      if (!chanRes.ok) throw new Error('Failed to fetch OTA channels')
      const chanData = await chanRes.json()
      setChannels(chanData)

      // 2. Fetch room types (for mapping dropdown)
      const rtRes = await fetch('/api/dashboard/room-types')
      if (!rtRes.ok) throw new Error('Failed to fetch room categories')
      const rtData = await rtRes.json()
      setRoomTypes(rtData)
      if (rtData.length > 0) {
        setNewMappingForm(prev => ({ ...prev, roomTypeId: rtData[0].id }))
      }

      // 3. Fetch sync logs
      await fetchLogs()
    } catch (err: any) {
      setError(err.message || 'An error occurred loading channels dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    setLogsLoading(true)
    try {
      let url = '/api/dashboard/channels/sync-logs'
      const queryParams = new URLSearchParams()
      if (filters.channelId !== 'ALL') queryParams.append('channelId', filters.channelId)
      if (filters.status !== 'ALL') queryParams.append('status', filters.status)
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }
      
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch sync logs')
      const logData = await res.json()
      setLogs(logData)
    } catch (err) {
      console.error(err)
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [filters])

  // Select channel for configuration
  const handleSelectChannel = async (channel: Channel) => {
    setSelectedChannel(channel)
    setCredentialsForm({
      apiKey: channel.apiKey || '',
      apiSecret: channel.apiSecret || '',
      status: channel.status
    })
    
    // Fetch mappings for this channel
    try {
      const res = await fetch(`/api/dashboard/channels/${channel.id}/mappings`)
      if (!res.ok) throw new Error('Failed to load mappings')
      const data = await res.json()
      setMappings(data.mappings || [])
    } catch (err) {
      console.error(err)
    }
  }

  // Save Channel Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChannel) return
    setSaveLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const liveStatus = credentialsForm.apiKey ? 'CONNECTED' : 'DEMO'
      const res = await fetch(`/api/dashboard/channels?id=${selectedChannel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: credentialsForm.apiKey,
          apiSecret: credentialsForm.apiSecret,
          status: liveStatus
        }),
      })

      if (!res.ok) throw new Error('Failed to update channel details')
      const updated = await res.json()
      
      // Update local states
      setChannels(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
      setSelectedChannel(prev => prev ? { ...prev, ...updated } : null)
      setSuccess(`Channel credentials updated. Status set to: ${liveStatus}`)
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Credentials update failed')
    } finally {
      setSaveLoading(false)
    }
  }

  // Toggle Live/Demo mode explicitly
  const handleToggleMode = async () => {
    if (!selectedChannel) return
    const targetStatus = credentialsForm.status === 'DEMO' ? 'CONNECTED' : 'DEMO'
    
    if (targetStatus === 'CONNECTED' && !credentialsForm.apiKey) {
      setError('An API Key is required to switch to Live Connected mode.')
      return
    }

    setSaveLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/dashboard/channels?id=${selectedChannel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus
        }),
      })

      if (!res.ok) throw new Error('Failed to change channel sync mode')
      const updated = await res.json()

      setChannels(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
      setSelectedChannel(prev => prev ? { ...prev, ...updated } : null)
      setCredentialsForm(prev => ({ ...prev, status: targetStatus }))
      setSuccess(`Sync mode updated to: ${targetStatus === 'CONNECTED' ? 'Live Connected' : 'Demo Mode'}`)
      setTimeout(() => setSuccess(null), 4000)
    } catch (err: any) {
      setError(err.message || 'Mode switch failed')
    } finally {
      setSaveLoading(false)
    }
  }

  // Create Mapping
  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChannel) return
    if (!newMappingForm.roomTypeId || !newMappingForm.externalRoomCode) return
    setAddingMapping(true)
    setError(null)

    try {
      const res = await fetch(`/api/dashboard/channels/${selectedChannel.id}/mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: newMappingForm.roomTypeId,
          externalRoomCode: newMappingForm.externalRoomCode,
          rateCode: newMappingForm.rateCode || null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create room mapping')

      setMappings(prev => [...prev, data])
      setNewMappingForm(prev => ({
        ...prev,
        externalRoomCode: '',
        rateCode: ''
      }))
      
      // Update channel card count
      setChannels(prev => prev.map(c => c.id === selectedChannel.id ? {
        ...c,
        _count: {
          ...c._count!,
          mappings: (c._count?.mappings || 0) + 1
        }
      } : c))

      setSuccess('Room mapped successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Mapping failed')
    } finally {
      setAddingMapping(false)
    }
  }

  // Delete Mapping
  const handleDeleteMapping = async (mappingId: string) => {
    if (!selectedChannel) return
    setError(null)

    try {
      const res = await fetch(`/api/dashboard/channels/${selectedChannel.id}/mappings?mappingId=${mappingId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete mapping')

      setMappings(prev => prev.filter(m => m.id !== mappingId))

      // Update channel card count
      setChannels(prev => prev.map(c => c.id === selectedChannel.id ? {
        ...c,
        _count: {
          ...c._count!,
          mappings: Math.max(0, (c._count?.mappings || 1) - 1)
        }
      } : c))

      setSuccess('Mapping removed.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Delete mapping failed')
    }
  }

  // Rotate iCal token
  const handleRotateToken = async (roomTypeId: string) => {
    setRotatingTokenId(roomTypeId)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/dashboard/room-types?id=${roomTypeId}&action=rotate-ical-token`, {
        method: 'PATCH'
      })
      if (!res.ok) throw new Error('Failed to rotate token')
      const data = await res.json()

      setRoomTypes(prev => prev.map(rt =>
        rt.id === roomTypeId ? { ...rt, icalToken: data.icalToken } : rt
      ))
      setSuccess('iCal token rotated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Token rotation failed')
    } finally {
      setRotatingTokenId(null)
    }
  }

  // Toggle syncEnabled for mapping
  const handleToggleMappingSync = async (mappingId: string, currentVal: boolean) => {
    if (!selectedChannel) return
    try {
      const res = await fetch(`/api/dashboard/channels/${selectedChannel.id}/mappings?mappingId=${mappingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncEnabled: !currentVal })
      })

      if (!res.ok) throw new Error('Failed to toggle mapping sync')
      const updated = await res.json()
      setMappings(prev => prev.map(m => m.id === mappingId ? { ...m, syncEnabled: updated.syncEnabled } : m))
    } catch (err: any) {
      setError(err.message || 'Failed to update mapping sync')
    }
  }

  // Test Connection
  const handleTestConnection = async (channelId: string) => {
    setTestingId(channelId)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/dashboard/channels/${channelId}/test`, {
        method: 'POST'
      })
      const data = await res.json()

      // Refresh channels to update status
      const chanRes = await fetch('/api/dashboard/channels')
      if (chanRes.ok) {
        const chanData = await chanRes.json()
        setChannels(chanData)
        // If this channel is currently selected, update it
        if (selectedChannel && selectedChannel.id === channelId) {
          const updatedChan = chanData.find((c: Channel) => c.id === channelId)
          if (updatedChan) {
            setSelectedChannel(updatedChan)
            setCredentialsForm(prev => ({ ...prev, status: updatedChan.status }))
          }
        }
      }

      if (data.success) {
        setSuccess(`Connection test passed: ${data.message}`)
      } else {
        setError(`Connection test failed: ${data.message}`)
      }
    } catch (err: any) {
      setError('Connection test request failed')
    } finally {
      setTestingId(null)
    }
  }

  // Sync Now
  const handleSyncChannel = async (channelId: string) => {
    setSyncingId(channelId)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/dashboard/channels/${channelId}/sync`, {
        method: 'POST'
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess(`Synchronization complete for channel. Status: ${data.availability.status}`)
        
        // Refresh channels and logs
        const chanRes = await fetch('/api/dashboard/channels')
        if (chanRes.ok) setChannels(await chanRes.json())
        await fetchLogs()
      } else {
        throw new Error(data.error || 'Sync failed')
      }
    } catch (err: any) {
      setError(err.message || 'Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  // Sync All
  const handleSyncAll = async () => {
    setSyncingAll(true)
    setError(null)
    setSuccess(null)

    try {
      const activeChannels = channels.filter(c => ['DEMO', 'CONNECTED'].includes(c.status))
      if (activeChannels.length === 0) {
        setError('No active or demo channels configured to sync.')
        setSyncingAll(false)
        return
      }

      let succeeded = 0
      for (const chan of activeChannels) {
        try {
          const res = await fetch(`/api/dashboard/channels/${chan.id}/sync`, { method: 'POST' })
          if (res.ok) succeeded++
        } catch (e) {
          console.error(`Error syncing channel ${chan.name}:`, e)
        }
      }

      setSuccess(`Full OTA Sync sequence finished. ${succeeded} of ${activeChannels.length} channels synchronized.`)
      
      // Refresh channels and logs
      const chanRes = await fetch('/api/dashboard/channels')
      if (chanRes.ok) setChannels(await chanRes.json())
      await fetchLogs()
    } catch (err: any) {
      setError('Sync all request failed')
    } finally {
      setSyncingAll(false)
    }
  }

  // Format Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DEMO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Demo Mode
          </span>
        )
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            Live Connect
          </span>
        )
      case 'DISCONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
            Disconnected
          </span>
        )
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
            Sync Error
          </span>
        )
      default:
        return null
    }
  }

  const getLogStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            Success
          </span>
        )
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            Partial Fail
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
            Failed
          </span>
        )
      default:
        return null
    }
  }

  const getChannelStyle = (slug: string) => {
    switch (slug) {
      case 'booking-com':
        return {
          barColor: 'bg-blue-600',
          gradColor: 'from-blue-600/10 to-transparent',
          textColor: 'text-blue-700'
        }
      case 'expedia':
        return {
          barColor: 'bg-amber-500',
          gradColor: 'from-amber-500/10 to-transparent',
          textColor: 'text-amber-700'
        }
      case 'airbnb':
        return {
          barColor: 'bg-rose-500',
          gradColor: 'from-rose-500/10 to-transparent',
          textColor: 'text-rose-700'
        }
      default:
        return {
          barColor: 'bg-primary',
          gradColor: 'from-primary/10 to-transparent',
          textColor: 'text-primary'
        }
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">Loading channel connections...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Globe size={24} className="text-primary" />
            <span>OTA Channel Manager</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Synchronize pricing and room availability in real-time across major hotel booking platforms (Booking.com, Airbnb, Expedia) in sandbox/demo mode.
          </p>
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncingAll}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          {syncingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          <span>Sync All Active Channels</span>
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-in slide-in-from-top duration-200">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-in slide-in-from-top duration-200">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channels.map((chan) => {
          const style = getChannelStyle(chan.slug)
          const isTesting = testingId === chan.id
          const isSyncing = syncingId === chan.id
          const isSelected = selectedChannel?.id === chan.id

          return (
            <div 
              key={chan.id} 
              className={`relative bg-card border rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary border-transparent' : 'border-border'
              }`}
            >
              {/* Top border band */}
              <div className={`h-1.5 w-full ${style.barColor}`} />

              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground text-base">{chan.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{chan.slug}</p>
                  </div>
                  {getStatusBadge(chan.status)}
                </div>

                <div className="space-y-1.5 py-1 text-xs border-y border-border/60">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mapped room types:</span>
                    <span className="font-semibold text-foreground">{chan._count?.mappings || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span className="font-semibold text-foreground truncate pl-2">
                      {chan.lastSyncAt ? new Date(chan.lastSyncAt).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(chan.id)}
                    disabled={isTesting || isSyncing}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border/80 transition-all cursor-pointer"
                  >
                    {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    <span>Test Ping</span>
                  </button>

                  <button
                    onClick={() => handleSyncChannel(chan.id)}
                    disabled={isTesting || isSyncing}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border/80 transition-all cursor-pointer"
                  >
                    {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw size={12} />}
                    <span>Sync</span>
                  </button>

                  <button
                    onClick={() => handleSelectChannel(chan)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-primary/5 text-primary hover:bg-primary/10 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-primary/20 transition-all cursor-pointer"
                  >
                    <Sliders size={12} />
                    <span>Configure Mappings</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Channel Configuration & Mappings Panel */}
      {selectedChannel && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-muted px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={18} className="text-muted-foreground" />
              <h2 className="font-bold text-foreground text-sm">
                Configuration for <span className="text-primary">{selectedChannel.name}</span>
              </h2>
            </div>
            <button 
              onClick={() => setSelectedChannel(null)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Close Panel
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Credentials Column */}
            <div className="lg:col-span-2 p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Key size={14} className="text-muted-foreground" />
                  <span>API Connection</span>
                </h3>
                
                {/* Demo / Live Toggle */}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  disabled={saveLoading}
                  className="flex items-center gap-1 text-xs font-semibold"
                >
                  <span className="text-muted-foreground uppercase text-[10px]">
                    {credentialsForm.status === 'DEMO' ? 'Demo Sandbox' : 'Live Sync'}
                  </span>
                  {credentialsForm.status === 'DEMO' ? (
                    <ToggleLeft size={24} className="text-muted-foreground hover:text-foreground cursor-pointer" />
                  ) : (
                    <ToggleRight size={24} className="text-primary cursor-pointer" />
                  )}
                </button>
              </div>

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>API Key / Username</span>
                    <button
                      type="button"
                      onClick={() => setRevealApiFields(!revealApiFields)}
                      className="text-[10px] text-primary hover:underline flex items-center gap-1 normal-case"
                    >
                      {revealApiFields ? <EyeOff size={11} /> : <Eye size={11} />}
                      <span>{revealApiFields ? 'Hide' : 'Reveal'}</span>
                    </button>
                  </label>
                  <input
                    type={revealApiFields ? 'text' : 'password'}
                    value={credentialsForm.apiKey}
                    onChange={(e) => setCredentialsForm(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="booking_com_merchant_id_1092"
                    className="w-full text-sm rounded-lg border border-border bg-muted/50 px-3 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">API Secret / Password</label>
                  <input
                    type={revealApiFields ? 'text' : 'password'}
                    value={credentialsForm.apiSecret}
                    onChange={(e) => setCredentialsForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="w-full text-sm rounded-lg border border-border bg-muted/50 px-3 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    {saveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    <span>Save API Settings</span>
                  </button>
                </div>
              </form>

              <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3.5 text-xs text-blue-800 space-y-1.5">
                <p className="font-semibold flex items-center gap-1.5">
                  <Info size={13} className="text-blue-600" />
                  <span>Sandbox Connection Details</span>
                </p>
                <p className="leading-relaxed text-blue-700/95">
                  Since this is a simulated integration, you can provide any dummy API credentials. Toggling "Live Sync" will enable standard operations but run them against the simulator logs database.
                </p>
              </div>
            </div>

            {/* Mappings Column */}
            <div className="lg:col-span-3 p-6 space-y-6">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 pb-3 border-b border-border">
                <Database size={14} className="text-muted-foreground" />
                <span>Room Code Mappings</span>
              </h3>

              {/* Mappings Table */}
              {mappings.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                  No rooms mapped on this channel. Add mappings below to sync inventory.
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden text-xs bg-muted/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted border-b border-border text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                        <th className="p-3">Local Room Category</th>
                        <th className="p-3">External OTA Code</th>
                        <th className="p-3">Rate Plan</th>
                        <th className="p-3">iCal Export</th>
                        <th className="p-3 text-center">Sync</th>
                        <th className="p-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/80">
                      {mappings.map((map) => {
                        const rt = roomTypes.find(rt => rt.id === map.roomTypeId)
                        const roomTypeName = rt?.name || 'Unknown'
                        const icalUrl = rt?.icalToken ? `${window.location.origin}/api/ical/export/${rt.icalToken}` : null
                        return (
                          <tr key={map.id} className="hover:bg-muted/40 text-foreground/90 font-medium">
                            <td className="p-3 font-semibold">{roomTypeName}</td>
                            <td className="p-3 font-mono text-muted-foreground">{map.externalRoomCode}</td>
                            <td className="p-3 font-mono text-muted-foreground">{map.rateCode || 'Standard'}</td>
                            <td className="p-3">
                              {icalUrl ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    readOnly
                                    value={icalUrl}
                                    onClick={(e) => e.currentTarget.select()}
                                    className="w-28 text-[10px] font-mono bg-muted border border-border rounded px-1.5 py-1 truncate"
                                  />
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(icalUrl!); setSuccess('iCal URL copied!'); setTimeout(() => setSuccess(null), 2000) }}
                                    className="text-[10px] text-primary hover:underline font-semibold whitespace-nowrap cursor-pointer"
                                    title="Copy iCal URL"
                                  >
                                    Copy
                                  </button>
                                  <button
                                    onClick={() => handleRotateToken(rt!.id)}
                                    disabled={rotatingTokenId === rt!.id}
                                    className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50"
                                    title="Rotate iCal token"
                                  >
                                    {rotatingTokenId === rt!.id ? '...' : 'Rotate'}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">No token</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleToggleMappingSync(map.id, map.syncEnabled)}
                                className={`text-xs p-1 rounded transition-colors ${
                                  map.syncEnabled 
                                    ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50' 
                                    : 'text-gray-400 hover:text-gray-500 bg-gray-50'
                                }`}
                              >
                                {map.syncEnabled ? 'Enabled' : 'Disabled'}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => handleDeleteMapping(map.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Mapping Form */}
              <div className="bg-muted/40 border border-border/80 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">Add Room Type Mapping</h4>
                <form onSubmit={handleAddMapping} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Local Room Type</label>
                    <select
                      value={newMappingForm.roomTypeId}
                      onChange={(e) => setNewMappingForm(prev => ({ ...prev, roomTypeId: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none transition-all"
                    >
                      {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>
                          {rt.name} (${rt.basePrice}/night)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">External OTA Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STD_ROOM_101"
                      value={newMappingForm.externalRoomCode}
                      onChange={(e) => setNewMappingForm(prev => ({ ...prev, externalRoomCode: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase">Rate Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. BAR_RATE"
                      value={newMappingForm.rateCode}
                      onChange={(e) => setNewMappingForm(prev => ({ ...prev, rateCode: e.target.value }))}
                      className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={addingMapping}
                      className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                    >
                      {addingMapping ? <Loader2 className="h-3 animate-spin" /> : <Plus size={13} />}
                      <span>Add Mapping Link</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Logs Section */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-foreground text-base">Channel Activity Logs</h2>
            <p className="text-xs text-muted-foreground">Chronological log of pricing, availability pushes, and incoming booking pull sync operations.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <select
                value={filters.channelId}
                onChange={(e) => setFilters(prev => ({ ...prev, channelId: e.target.value }))}
                className="text-xs rounded-lg border border-border bg-muted/50 px-3 py-2 focus:bg-background focus:outline-none"
              >
                <option value="ALL">All Channels</option>
                {channels.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="text-xs rounded-lg border border-border bg-muted/50 px-3 py-2 focus:bg-background focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="PARTIAL">Partial Fail</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="p-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg hover:text-foreground transition-colors border border-border"
              title="Refresh logs"
            >
              <RefreshCw size={14} className={logsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        {logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-xs">
            No synchronization operations recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Items Synced</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 text-foreground/80 font-medium">
                    <td className="p-4 text-muted-foreground font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-foreground">{log.channel.name}</td>
                    <td className="p-4 font-mono text-[10px] text-muted-foreground">
                      {log.action}
                    </td>
                    <td className="p-4">{getLogStatusBadge(log.status)}</td>
                    <td className="p-4 text-center font-mono font-semibold">{log.itemCount}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-primary hover:underline font-semibold"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/50">
              <div>
                <h3 className="font-bold text-sm text-foreground">Sync Log details</h3>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Channel</span>
                  <span className="font-bold text-foreground mt-0.5 block">{selectedLog.channel.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Timestamp</span>
                  <span className="font-medium text-foreground mt-0.5 block">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Action</span>
                  <span className="font-mono text-[10px] text-foreground mt-0.5 block">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Status</span>
                  <div className="mt-0.5">{getLogStatusBadge(selectedLog.status)}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Response Metadata</span>
                <pre className="bg-muted p-3.5 rounded-lg text-[11px] font-mono text-foreground overflow-x-auto max-h-[160px] border border-border">
                  {selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : 'No details recorded.'}
                </pre>
              </div>
            </div>

            <div className="bg-muted/30 px-5 py-3.5 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
