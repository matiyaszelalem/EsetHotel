'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react'
import { useConfirm } from '@/hooks/use-confirm'

interface SpecialOffer {
  id: string
  title: string
  description: string
  imageUrl: string | null
  validFrom: string
  validTo: string
  active: boolean
  promoCodeId: string | null
  promoCode?: { code: string } | null
}

export default function OffersManagement() {
  const { confirm, dialog } = useConfirm()
  const [offers, setOffers] = useState<SpecialOffer[]>([])
  const [promos, setPromos] = useState<{id: string, code: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Form state
  const [newOffer, setNewOffer] = useState({
    title: '',
    description: '',
    imageUrl: '',
    validFrom: '',
    validTo: '',
    active: true,
    promoCodeId: '',
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [offersRes, promosRes] = await Promise.all([
        fetch('/api/dashboard/content/offers'),
        fetch('/api/dashboard/promos')
      ])
      
      if (!offersRes.ok) throw new Error('Failed to fetch offers')
      if (!promosRes.ok) throw new Error('Failed to fetch promos')
        
      const offersData = await offersRes.json()
      const promosData = await promosRes.json()
      
      setOffers(offersData)
      setPromos(promosData)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    setModalError('')
    try {
      const res = await fetch('/api/dashboard/content/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOffer),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create offer')

      setIsModalOpen(false)
      // Reset form
      setNewOffer({
        title: '',
        description: '',
        imageUrl: '',
        validFrom: '',
        validTo: '',
        active: true,
        promoCodeId: '',
      })
      fetchData()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred')
    } finally {
      setModalLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/content/offers?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update offer')
      }

      fetchData()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  const handleDeleteOffer = async (id: string) => {
    if (!await confirm('Are you sure you want to delete this offer?')) return
    try {
      const res = await fetch(`/api/dashboard/content/offers?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete offer')
      }

      fetchData()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  if (loading && offers.length === 0) {
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
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Special Offers</h1>
          <p className="text-sm text-muted-foreground">Manage promotional banners shown on the landing page.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <Plus size={16} />
          <span>Add Offer</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Offer Title</th>
                <th className="px-6 py-3.5">Validity Dates</th>
                <th className="px-6 py-3.5">Promo Code</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    No special offers found. Click "Add Offer" to create one.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => {
                  const validFrom = new Date(offer.validFrom).toLocaleDateString()
                  const validTo = new Date(offer.validTo).toLocaleDateString()

                  return (
                    <tr key={offer.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{offer.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={offer.description}>
                          {offer.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground/70">
                        {validFrom} – {validTo}
                      </td>
                      <td className="px-6 py-4">
                        {offer.promoCode ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-light text-primary border border-primary/20">
                            {offer.promoCode.code}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(offer.id, offer.active)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {offer.active ? (
                            <span className="flex items-center text-emerald-600 font-semibold gap-1 text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                            </span>
                          ) : (
                            <span className="flex items-center text-slate-400 font-semibold gap-1 text-xs">
                              <span className="w-2 h-2 rounded-full bg-slate-300"></span> Inactive
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded border border-transparent hover:border-destructive/20 transition-colors"
                          title="Delete Offer"
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

      {/* Create Offer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-xl max-w-md w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-lg text-foreground">Add Special Offer</h3>
                <p className="text-xs text-muted-foreground">Create a promotional banner for the landing page.</p>
              </div>
            </div>

            <div className="overflow-y-auto">
              <form onSubmit={handleCreateOffer} className="p-6 space-y-4">
                {modalError && (
                  <div className="flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Offer Title</label>
                  <input
                    type="text"
                    required
                    value={newOffer.title}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Summer Staycation Deal"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
                  <textarea
                    required
                    value={newOffer.description}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Book 3 nights and get the 4th free!"
                    rows={3}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all resize-none"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <ImageIcon size={14} /> Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newOffer.imageUrl}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Valid From</label>
                    <input
                      type="date"
                      required
                      value={newOffer.validFrom}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, validFrom: e.target.value }))}
                      className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Valid To</label>
                    <input
                      type="date"
                      required
                      value={newOffer.validTo}
                      onChange={(e) => setNewOffer(prev => ({ ...prev, validTo: e.target.value }))}
                      className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Linked Promo Code (Optional)</label>
                  <select
                    value={newOffer.promoCodeId}
                    onChange={(e) => setNewOffer(prev => ({ ...prev, promoCodeId: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                  >
                    <option value="">No code</option>
                    {promos.map(promo => (
                      <option key={promo.id} value={promo.id}>{promo.code}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-border hover:bg-muted rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 rounded-lg text-sm font-medium transition-all shadow-sm"
                  >
                    {modalLoading ? 'Saving...' : 'Add Offer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  )
}
