'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, AlertCircle, Loader2, Star, CheckCircle, XCircle } from 'lucide-react'

interface Testimonial {
  id: string
  guestName: string
  rating: number
  comment: string
  approved: boolean
  createdAt: string
}

export default function TestimonialsManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Form state
  const [newTestimonial, setNewTestimonial] = useState({
    guestName: '',
    rating: 5,
    comment: '',
    approved: true,
  })

  const fetchTestimonials = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/content/testimonials')
      if (!res.ok) throw new Error('Failed to fetch testimonials')
      const data = await res.json()
      setTestimonials(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const handleCreateTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    setModalError('')
    try {
      const res = await fetch('/api/dashboard/content/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTestimonial),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create testimonial')

      setIsModalOpen(false)
      // Reset form
      setNewTestimonial({
        guestName: '',
        rating: 5,
        comment: '',
        approved: true,
      })
      fetchTestimonials()
    } catch (err: any) {
      setModalError(err.message || 'An error occurred')
    } finally {
      setModalLoading(false)
    }
  }

  const handleToggleApproved = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/dashboard/content/testimonials?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !currentStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update testimonial')
      }

      fetchTestimonials()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    try {
      const res = await fetch(`/api/dashboard/content/testimonials?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete testimonial')
      }

      fetchTestimonials()
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  if (loading && testimonials.length === 0) {
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
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Testimonials</h1>
          <p className="text-sm text-muted-foreground">Manage guest reviews shown on the landing page.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <Plus size={16} />
          <span>Add Testimonial</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                <th className="px-6 py-3.5">Guest Name</th>
                <th className="px-6 py-3.5">Rating</th>
                <th className="px-6 py-3.5 w-1/3">Comment</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {testimonials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    No testimonials found. Click "Add Testimonial" to create one.
                  </td>
                </tr>
              ) : (
                testimonials.map((testimonial) => (
                  <tr key={testimonial.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {testimonial.guestName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={14} className={i < testimonial.rating ? "fill-current" : "text-slate-200"} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground/80 line-clamp-2" title={testimonial.comment}>
                      {testimonial.comment}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleApproved(testimonial.id, testimonial.approved)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          testimonial.approved 
                          ? 'bg-success/10 text-success hover:bg-emerald-100' 
                          : 'bg-warning/10 text-warning hover:bg-amber-100'
                        } transition-colors`}
                      >
                        {testimonial.approved ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {testimonial.approved ? 'Approved' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded border border-transparent hover:border-rose-100 transition-colors"
                        title="Delete Testimonial"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Testimonial Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-xl max-w-md w-full shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-slate-800">Add Testimonial</h3>
                <p className="text-xs text-muted-foreground">Manually add a guest review.</p>
              </div>
            </div>

            <form onSubmit={handleCreateTestimonial} className="p-6 space-y-4">
              {modalError && (
                <div className="flex items-center gap-3 rounded-[8px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Guest Name</label>
                <input
                  type="text"
                  required
                  value={newTestimonial.guestName}
                  onChange={(e) => setNewTestimonial(prev => ({ ...prev, guestName: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  required
                  value={newTestimonial.rating}
                  onChange={(e) => setNewTestimonial(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Comment</label>
                <textarea
                  required
                  value={newTestimonial.comment}
                  onChange={(e) => setNewTestimonial(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Great stay! Highly recommended."
                  rows={4}
                  className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2 focus:bg-background focus:border-primary focus:outline-none transition-all resize-none"
                />
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
                  {modalLoading ? 'Saving...' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
