'use client'

import { useEffect, useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Shield
} from 'lucide-react'

interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/account/profile')
      if (!res.ok) throw new Error('Failed to load profile')
      const data = await res.json()
      setProfile(data)
      setName(data.name)
      setEmail(data.email)
      setPhone(data.phone || '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setSaving(false)
      return
    }

    try {
      const body: any = { name, email, phone }
      if (newPassword) {
        if (!currentPassword) {
          setError('Current password is required to set a new password')
          setSaving(false)
          return
        }
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }

      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      setProfile(data)
      setName(data.name)
      setEmail(data.email)
      setPhone(data.phone || '')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Update your personal details and account security.</p>
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
        {/* Personal Details */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3">
            <User size={16} className="text-muted-foreground" />
            <span>Personal Details</span>
          </h3>

          {/* Avatar preview */}
          <div className="flex items-center gap-4 pb-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground">{name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Shield size={12} />
                <span className="font-medium">{profile?.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                <User size={13} /> Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Mail size={13} /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  placeholder="admin@esethotel.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Phone size={13} /> Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  placeholder="+251 911 000 000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-3">
            <Lock size={16} className="text-muted-foreground" />
            <span>Change Password</span>
          </h3>

          <p className="text-xs text-muted-foreground -mt-2">
            Leave blank to keep your current password. If setting a new one, you must enter your current password.
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-md cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  )
}
