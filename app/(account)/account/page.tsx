'use client'

import { useEffect, useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  ShieldAlert
} from 'lucide-react'

export default function GuestProfilePage() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
  })
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/account/profile')
        if (!res.ok) throw new Error('Failed to load profile details')
        const data = await res.json()
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || '',
        })
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaveLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[40vh] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">Update your contact information and manage your member profile.</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <User size={13} /> Full Name
            </label>
            <input
              type="text"
              required
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus:bg-white focus:border-primary focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Mail size={13} /> Email Address
            </label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full text-sm rounded-lg border border-slate-200 bg-muted px-3.5 py-2.5 text-muted-foreground cursor-not-allowed outline-none"
            />
            <p className="text-[10px] text-muted-foreground italic">Email address cannot be changed. Please contact support if you need to update it.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Phone size={13} /> Phone Number
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus:bg-white focus:border-primary focus:outline-none transition-all"
            />
          </div>

          <div className="border-t border-border pt-5 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldAlert size={14} className="text-primary" />
              <span>Membership Role: <strong className="text-foreground/80 capitalize">{profile.role.toLowerCase()}</strong></span>
            </div>
            <button
              type="submit"
              disabled={saveLoading}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow"
            >
              {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
