'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users as UsersIcon,
  Plus,
  Search,
  Mail,
  Phone,
  Shield,
  Loader2,
  AlertCircle,
  X,
  Check,
  Trash2,
  Edit,
  Calendar,
} from 'lucide-react'
import { useConfirm } from '@/hooks/use-confirm'

interface User {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  createdAt: string
  updatedAt: string
  _count: { bookings: number }
}

const ROLES = ['STAFF', 'ADMIN', 'SUPER_ADMIN']

export default function UsersManagement() {
  const router = useRouter()
  const { confirm, dialog } = useConfirm()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState('')

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STAFF', phone: '' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      setUsers(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    fetch('/api/account/profile')
      .then(res => res.json())
      .then(data => setCurrentUserRole(data.role || ''))
      .catch(() => {})
  }, [])

  const availableRoles = currentUserRole === 'SUPER_ADMIN' ? ROLES : ROLES.filter(r => r !== 'SUPER_ADMIN')

  const openCreate = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', password: '', role: 'STAFF', phone: '' })
    setFormError('')
    setIsModalOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setFormData({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    try {
      if (editingUser) {
        const body: any = { name: formData.name, email: formData.email, role: formData.role, phone: formData.phone }
        if (formData.password) body.password = formData.password

        const res = await fetch(`/api/dashboard/users?id=${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update user')
      } else {
        if (!formData.password) throw new Error('Password is required')
        const res = await fetch('/api/dashboard/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create user')
      }

      setIsModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!await confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/dashboard/users?id=${user.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete user')
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredUsers = users.filter(u =>
    !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Staff & Admin Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage hotel staff and administrator accounts.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          <span>Add Staff / Admin</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-muted border border-border rounded-lg outline-none focus:bg-background focus:border-primary transition-all"
        />
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${
                  user.role === 'SUPER_ADMIN'
                    ? 'bg-purple-50 text-purple-700 border-purple-200/50'
                    : user.role === 'ADMIN'
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-info/10 text-info border-info/20'
                }`}>
                  {user.role.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                {user.phone && <div className="flex items-center gap-1.5"><Phone size={12} /> {user.phone}</div>}
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {(user.role !== 'SUPER_ADMIN' || currentUserRole === 'SUPER_ADMIN') && (
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => openEdit(user)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {searchQuery ? 'No users match your search.' : 'No users found.'}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-xl max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  {editingUser ? 'Edit User' : 'Add Staff / Admin'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {editingUser ? `Editing ${editingUser.name}` : 'Create a new STAFF or ADMIN account'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle size={16} /> <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text" required value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Email</label>
                  <input
                    type="email" required value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="staff@esethotel.com"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Password {editingUser && '(leave blank to keep)'}
                  </label>
                  <input
                    type="password" value={formData.password}
                    onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                    placeholder={editingUser ? 'Keep current' : 'Min 6 chars'}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  >
                    {availableRoles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Phone (Optional)</label>
                  <input
                    type="tel" value={formData.phone}
                    onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+251 911 000 000"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 rounded-lg text-sm font-medium transition-all flex items-center gap-2">
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
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
