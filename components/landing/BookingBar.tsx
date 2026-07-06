'use client'

import { useState, useEffect, useTransition, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CalendarDays, Users, Search, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatDate(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function todayStr() { return formatDate(new Date()) }
function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatDate(d)
}

function BookingField({ checkIn, checkOut, guests, value, onChange }: {
  checkIn?: boolean; checkOut?: boolean; guests?: boolean
  value: string; onChange: (v: string) => void
}) {
  if (checkIn) {
    return (
      <div className="flex flex-col rounded-[10px] bg-secondary/60 px-4 py-2 border border-border transition-colors hover:bg-secondary/90">
        <label className="mb-0.5 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[1.5px] text-muted-foreground">
          <CalendarDays size={10} />
          Check In
        </label>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-sans text-[13px] font-medium text-foreground outline-none"
        />
      </div>
    )
  }
  if (checkOut) {
    return (
      <div className="flex flex-col rounded-[10px] bg-secondary/60 px-4 py-2 border border-border transition-colors hover:bg-secondary/90">
        <label className="mb-0.5 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[1.5px] text-muted-foreground">
          <CalendarDays size={10} />
          Check Out
        </label>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-sans text-[13px] font-medium text-foreground outline-none"
        />
      </div>
    )
  }
  if (guests) {
    return (
      <div className="flex flex-col rounded-[10px] bg-secondary/60 px-4 py-2 border border-border transition-colors hover:bg-secondary/90">
        <label className="mb-0.5 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[1.5px] text-muted-foreground">
          <Users size={10} />
          Guests
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-transparent font-sans text-[13px] font-medium text-foreground outline-none"
        >
          <option value="1">1 Guest</option>
          <option value="2">2 Guests</option>
          <option value="3">3 Guests</option>
          <option value="4">4 Guests</option>
          <option value="5">5+ Guests</option>
        </select>
      </div>
    )
  }
  return null
}

function BookingBarInner() {
  const [isVisible, setIsVisible] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const checkIn = searchParams.get('checkIn') || todayStr()
  const checkOut = searchParams.get('checkOut') || tomorrowStr()
  const guests = searchParams.get('guests') || '2'

  const updateParam = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(key, value)
      router.replace('?' + params.toString(), { scroll: false })
    })
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    params.set('checkIn', checkIn)
    params.set('checkOut', checkOut)
    params.set('guests', guests)
    router.push('/booking?' + params.toString())
  }

  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById('hero')
      if (!heroEl) return
      setIsVisible(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-40 w-[calc(100%-32px)] max-w-[900px] -translate-x-1/2 transition-all duration-500 ease-out sm:bottom-8",
        isVisible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-12 opacity-0 scale-95 pointer-events-none"
      )}
    >
      <div className="rounded-[16px] border border-primary/20 bg-background/80 shadow-2xl backdrop-blur-lg">
        <div className="hidden sm:grid sm:grid-cols-4 sm:items-center sm:gap-3 sm:p-4">
          <BookingField checkIn value={checkIn} onChange={(v) => updateParam('checkIn', v)} />
          <BookingField checkOut value={checkOut} onChange={(v) => updateParam('checkOut', v)} />
          <BookingField guests value={guests} onChange={(v) => updateParam('guests', v)} />
          <button
            onClick={handleSearch}
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-3 font-sans text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary-dark hover:shadow-glow active:scale-[0.98] disabled:opacity-70"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Book Stay
          </button>
        </div>

        <div className="sm:hidden p-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex w-full items-center justify-between rounded-[12px] bg-primary px-4 py-3 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 font-sans text-[14px] font-semibold text-primary-foreground">
              <Search size={16} />
              Book Stay
            </div>
            <ChevronDown
              size={18}
              className={`text-primary-foreground/70 transition-transform duration-300 ${mobileOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              mobileOpen ? 'max-h-[280px] opacity-100 mt-2' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-2">
              <BookingField checkIn value={checkIn} onChange={(v) => updateParam('checkIn', v)} />
              <BookingField checkOut value={checkOut} onChange={(v) => updateParam('checkOut', v)} />
              <BookingField guests value={guests} onChange={(v) => updateParam('guests', v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BookingBar() {
  return (
    <Suspense fallback={null}>
      <BookingBarInner />
    </Suspense>
  )
}
