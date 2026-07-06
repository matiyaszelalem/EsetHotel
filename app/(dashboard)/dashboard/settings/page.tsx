'use client'

import { useEffect, useState } from 'react'
import { 
  Settings, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Building,
  Mail,
  Phone,
  Percent,
  Clock
} from 'lucide-react'

export default function HotelSettingsPage() {
  const [settings, setSettings] = useState({
    hotelName: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    currency: 'USD',
    checkinTime: '',
    checkoutTime: '',
    taxRate: '0.15',
    etbConversionRate: '120',
  })
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchSettings = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setSettings({
        hotelName: data.hotelName || '',
        address: data.address || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        currency: data.currency || 'USD',
        checkinTime: data.checkinTime || '',
        checkoutTime: data.checkoutTime || '',
        taxRate: data.taxRate !== undefined ? data.taxRate.toString() : '0.15',
        etbConversionRate: data.etbConversionRate?.toString() || '120',
      })
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update hotel settings')

      setSuccess('Settings updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Hotel Settings</h1>
        <p className="text-sm text-muted-foreground">Configure global metadata, tax rates, stay parameters, and notifications.</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Settings */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3">
            <Building size={16} className="text-muted-foreground" />
            <span>Profile & Location</span>
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Hotel Name</label>
              <input
                type="text"
                required
                value={settings.hotelName}
                onChange={(e) => setSettings(prev => ({ ...prev, hotelName: e.target.value }))}
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Physical Address</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Mail size={13} /> Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={settings.contactEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Phone size={13} /> Contact Phone
                </label>
                <input
                  type="text"
                  required
                  value={settings.contactPhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stay & Pricing parameters */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3">
            <Clock size={16} className="text-muted-foreground" />
            <span>Stay Operations & Tax Settings</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Default Check-in Time</label>
              <input
                type="text"
                required
                value={settings.checkinTime}
                onChange={(e) => setSettings(prev => ({ ...prev, checkinTime: e.target.value }))}
                placeholder="14:00"
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Default Check-out Time</label>
              <input
                type="text"
                required
                value={settings.checkoutTime}
                onChange={(e) => setSettings(prev => ({ ...prev, checkoutTime: e.target.value }))}
                placeholder="11:00"
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tax Rate</label>
              <div className="relative">
                <Percent size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={settings.taxRate}
                  onChange={(e) => setSettings(prev => ({ ...prev, taxRate: e.target.value }))}
                  placeholder="0.15"
                  className="w-full text-sm rounded-lg border border-border bg-muted pl-8 pr-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ETB / Dual Pricing */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3">
            <Percent size={16} className="text-muted-foreground" />
            <span>Dual Pricing — ETB Conversion</span>
          </h3>
          <p className="text-xs text-muted-foreground -mt-2">
            All prices are stored in USD. The ETB rate is used to display the local currency equivalent 
            (e.g. $150 USD | 18,000 ETB) throughout the site and dashboard.
          </p>
          <div className="max-w-xs space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">1 USD = ? ETB</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={settings.etbConversionRate}
              onChange={(e) => setSettings(prev => ({ ...prev, etbConversionRate: e.target.value }))}
              className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
              placeholder="120"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveLoading}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-md cursor-pointer"
          >
            {saveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  )
}
