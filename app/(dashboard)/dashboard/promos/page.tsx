'use client'

import { useEffect, useState } from 'react'
import { 
  Plus, 
  Tag, 
  Trash2, 
  Calendar as CalendarIcon, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { useConfirm } from '@/hooks/use-confirm'

interface PromoCode {
  id: string
  code: string
  discountType: string // PERCENTAGE, FIXED
  value: number
  validFrom: string
  validTo: string
  usageLimit: number | null
  usedCount: number
  active: boolean
  createdAt: string
}

export default function PromosManagement() {
  const { confirm, dialog } = useConfirm()
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Form state
  const [newPromo, setNewPromo] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    value: '',
    validFrom: '',
    validTo: '',
    usageLimit: '',
    active: true,
  })

  const fetchPromos = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/promos')
      if (!res.ok) throw new Error('Failed to fetch promo codes')
      const data = await res.json()
      setPromos(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromos()
  }, [])

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    setModalError('')
    try {
      const res = await fetch('/api/dashboard/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPromo),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create promo code')

      setIsModalOpen(false)
      // Reset form
      setNewPromo({
        code: '',
        discountType: 'PERCENTAGE',
        value: '',
        validFrom: '',
        validTo: '',
        usageLimit: '',
        active: true,
      })
      fetchPromos()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred')
    } finally {
      setModalLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/promos?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to toggle promo code')
      }

      fetchPromos()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  const handleDeletePromo = async (id: string) => {
    if (!(await confirm('Are you sure you want to delete this promo code?'))) return
    try {
      const res = await fetch(`/api/dashboard/promos?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete promo code')
      }

      fetchPromos()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  if (loading && promos.length === 0) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Promo Codes</h1>
          <p className="text-sm text-muted-foreground">Configure discount coupons and promotional campaigns.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <Plus size={16} />
          <span>New Promo Code</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Promo Code</th>
                <th className="px-6 py-3.5">Discount details</th>
                <th className="px-6 py-3.5">Validity Dates</th>
                <th className="px-6 py-3.5">Usage Stats</th>
                <th className="px-6 py-3.5">Active</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No promo codes found. Click "New Promo Code" to create one.
                  </td>
                </tr>
              ) : (
                promos.map((promo) => {
                  const validFrom = new Date(promo.validFrom).toLocaleDateString()
                  const validTo = new Date(promo.validTo).toLocaleDateString()
                  const usageLimitText = promo.usageLimit !== null ? promo.usageLimit : '∞'

                  return (
                    <tr key={promo.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-primary" />
                          <span className="font-bold text-foreground font-mono tracking-wide">{promo.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-foreground">
                            {promo.discountType === 'PERCENTAGE' ? `${promo.value}%` : `$${promo.value}`}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1.5 lowercase">({promo.discountType})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {validFrom} – {validTo}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-foreground">{promo.usedCount}</span>
                          <span className="text-muted-foreground"> / {usageLimitText} uses</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(promo.id, promo.active)}
                          className="hover:text-foreground transition-colors"
                        >
                          {promo.active ? (
                            <span className="flex items-center text-success font-semibold gap-1 text-xs">
                              <span className="w-2 h-2 rounded-full bg-success"></span> Active
                            </span>
                          ) : (
                            <span className="flex items-center text-muted-foreground font-semibold gap-1 text-xs">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/50"></span> Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeletePromo(promo.id)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded border border-transparent hover:border-destructive/20 transition-colors"
                          title="Delete Code"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Promo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-slate-800">Add Promo Code</h3>
                <p className="text-xs text-slate-400">Create a new discount code for campaigns or reservations.</p>
              </div>
            </div>

            <form onSubmit={handleCreatePromo} className="p-6 space-y-4">
              {modalError && (
                <div className="flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Promo Code</label>
                <input
                  type="text"
                  required
                  value={newPromo.code}
                  onChange={(e) => setNewPromo(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/ /g, '') }))}
                  placeholder="WELCOME20"
                  className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 focus:bg-white focus:border-primary focus:outline-none transition-all uppercase font-mono tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Discount Type</label>
                  <select
                    value={newPromo.discountType}
                    onChange={(e) => setNewPromo(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 focus:bg-white focus:border-primary focus:outline-none transition-all"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={newPromo.value}
                    onChange={(e) => setNewPromo(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="20"
                    className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 focus:bg-white focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Valid From</label>
                  <input
                    type="date"
                    required
                    value={newPromo.validFrom}
                    onChange={(e) => setNewPromo(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 focus:bg-white focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Valid To</label>
                  <input
                    type="date"
                    required
                    value={newPromo.validTo}
                    onChange={(e) => setNewPromo(prev => ({ ...prev, validTo: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 focus:bg-white focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Usage Limit (Optional)</label>
                <input
                  type="number"
                  value={newPromo.usageLimit}
                  onChange={(e) => setNewPromo(prev => ({ ...prev, usageLimit: e.target.value }))}
                  placeholder="50 (leave empty for unlimited)"
                  className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 focus:bg-white focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 rounded-lg text-sm font-medium transition-all shadow-sm"
                >
                  {modalLoading ? 'Saving...' : 'Save Code'}
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
