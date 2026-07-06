'use client'

import { useEffect, useState } from 'react'
import { 
  Loader2, 
  AlertCircle, 
  Check, 
  Eye,
  RefreshCw
} from 'lucide-react'

interface HeroContent {
  title: string
  subtitle: string
  ctaText: string
  imageUrl: string
}

export default function HeroEditorPage() {
  const [heroContent, setHeroContent] = useState<HeroContent>({
    title: '',
    subtitle: '',
    ctaText: '',
    imageUrl: '/images/hero.png',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const fetchHeroContent = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/content/hero')
      if (!res.ok) throw new Error('Failed to load hero content')
      const data = await res.json()
      setHeroContent(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHeroContent()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/dashboard/content/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heroContent),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Hero Section Editor</h1>
          <p className="text-sm text-muted-foreground mt-1">Edit the landing page hero banner content.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground hover:bg-muted text-sm font-semibold rounded-lg transition-colors"
          >
            <Eye size={16} />
            <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>
          <button
            onClick={fetchHeroContent}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Form */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Hero Title</label>
              <textarea
                required
                value={heroContent.title}
                onChange={(e) => setHeroContent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Experience Luxury, Feel at Home."
                rows={2}
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Subtitle</label>
              <textarea
                required
                value={heroContent.subtitle}
                onChange={(e) => setHeroContent(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Discover the perfect blend of modern luxury and authentic Ethiopian hospitality..."
                rows={3}
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">CTA Button Text</label>
              <input
                type="text"
                required
                value={heroContent.ctaText}
                onChange={(e) => setHeroContent(prev => ({ ...prev, ctaText: e.target.value }))}
                placeholder="Book Your Stay"
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Hero Image URL</label>
              <input
                type="text"
                value={heroContent.imageUrl}
                onChange={(e) => setHeroContent(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="/images/hero.png"
                className="w-full text-sm rounded-lg border border-border bg-muted px-3.5 py-2.5 focus:bg-background focus:border-primary focus:outline-none transition-all"
              />
              <p className="text-[10px] text-slate-400">Path relative to the public directory, or a full URL.</p>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <div>
                {success && (
                  <span className="flex items-center gap-1.5 text-sm text-success font-medium">
                    <Check size={16} />
                    Saved successfully
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-60 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-800">
            <div className="px-4 py-2 bg-slate-800 flex items-center gap-2 border-b border-slate-700">
              <div className="h-3 w-3 rounded-full bg-rose-500"></div>
              <div className="h-3 w-3 rounded-full bg-amber-500"></div>
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              <span className="ml-2 text-[10px] text-slate-400 font-mono">Landing Page Preview</span>
            </div>
            <div className="relative h-[400px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-8">
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center max-w-lg">
                <div className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] uppercase tracking-[3px] text-white/70 mb-4">
                  ★★★★★ Luxury Hotel
                </div>
                <h2 className="text-white font-bold text-2xl leading-tight mb-3">
                  {heroContent.title || 'Experience Luxury, Feel at Home.'}
                </h2>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  {heroContent.subtitle || 'Discover the perfect blend...'}
                </p>
                <div className="inline-block bg-primary text-white px-6 py-3 rounded-lg text-sm font-semibold">
                  {heroContent.ctaText || 'Book Your Stay'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
