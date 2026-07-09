'use client'

import Image from 'next/image'
import { useRef, useState, useEffect, useTransition, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CalendarDays, Users, Search, Loader2 } from 'lucide-react'
import { useGSAP } from '@/lib/hooks/useGSAP'

function formatDate(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function todayStr() { return formatDate(new Date()) }
function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatDate(d)
}

interface HeroContent {
  eyebrow: string
  title: string
  subtitle: string
  ctaText: string
  imageUrl: string
  stats: { label: string; value: number; suffix: string; prefix: string }[]
}

const fallbackHeroContent: HeroContent = {
  eyebrow: 'Welcome to Eset Hotel',
  title: 'Your Premier Stay in Addis Ababa',
  subtitle: 'Experience luxury, comfort, and exceptional hospitality in the heart of the city.',
  ctaText: 'Check Availability',
  imageUrl: '/images/hero-background.png',
  stats: [
    { label: 'Rooms', value: 22, suffix: '+', prefix: '' },
    { label: 'Years Experience', value: 12, suffix: '+', prefix: '' },
    { label: 'Guests Served', value: 5000, suffix: '+', prefix: '' },
    { label: 'Amenities', value: 48, suffix: '+', prefix: '' },
  ],
}

function HeroInner() {
  const container = useRef<HTMLElement>(null)
  const [heroContent, setHeroContent] = useState<HeroContent>(fallbackHeroContent)
  const [heroImageUrl, setHeroImageUrl] = useState<string>(fallbackHeroContent.imageUrl)

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
    let canceled = false

    fetch('/api/content/hero')
      .then((res) => res.json())
      .then((data) => {
        if (canceled || !data || typeof data !== 'object') return

        const patch = {
          eyebrow: data.eyebrow ?? fallbackHeroContent.eyebrow,
          title: data.title ?? fallbackHeroContent.title,
          subtitle: data.subtitle ?? fallbackHeroContent.subtitle,
          ctaText: data.ctaText ?? fallbackHeroContent.ctaText,
          imageUrl: data.imageUrl ?? fallbackHeroContent.imageUrl,
          stats: Array.isArray(data.stats) ? data.stats : fallbackHeroContent.stats,
        }

        setHeroContent(patch)
        setHeroImageUrl(patch.imageUrl)
      })
      .catch(() => {
        setHeroContent(fallbackHeroContent)
        setHeroImageUrl(fallbackHeroContent.imageUrl)
      })

    return () => {
      canceled = true
    }
  }, [])

  useGSAP(
    (gsap) => {
      if (!container.current) return

      gsap.set('.hero-eyebrow', { y: 18 })
      gsap.set('.hero-headline', { y: 28 })
      gsap.set('.hero-body', { y: 18 })
      gsap.set('.hero-booking-widget', { y: 24 })
      gsap.set('.hero-stats span', { y: 10 })

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.to('.hero-eyebrow',
        { y: 0, opacity: 1, duration: 0.45 }
      )
      .to('.hero-headline',
        { y: 0, opacity: 1, duration: 0.60 },
        '-=0.28'
      )
      .to('.hero-body',
        { y: 0, opacity: 1, duration: 0.45 },
        '-=0.35'
      )
      .to('.hero-booking-widget',
        { y: 0, opacity: 1, duration: 0.50 },
        '-=0.25'
      )
      .to('.hero-stats span',
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.08 },
        '-=0.25'
      )

      const counters = container.current.querySelectorAll('[data-counter]')
      counters.forEach((counterEl) => {
        const targetValue = parseInt(counterEl.getAttribute('data-counter') || '0', 10)
        const suffix = counterEl.getAttribute('data-suffix') || ''
        const prefix = counterEl.getAttribute('data-prefix') || ''
        const counterObj = { val: 0 }

        gsap.to(counterObj, {
          val: targetValue,
          duration: 1.4,
          ease: 'power1.out',
          snap: { val: 1 },
          delay: 0.8,
          onUpdate: () => {
            counterEl.textContent = `${prefix}${counterObj.val.toLocaleString()}${suffix}`
          },
        })
      })

      gsap.fromTo('.navbar',
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.1 }
      )

      tl.to('.hero-scroll',
        { opacity: 1, duration: 0.35 },
        '-=0.20'
      )
    },
    []
  )

  return (
    <section ref={container} className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden" id="hero">
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImageUrl}
          alt="Hero background"
          fill
          className="object-cover"
          sizes="100vw"
          priority
          onError={() => setHeroImageUrl(fallbackHeroContent.imageUrl)}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg,
                rgba(42,37,32,0.70) 0%,
                rgba(42,37,32,0.40) 50%,
                rgba(42,37,32,0.65) 80%,
                rgba(42,37,32,0.90) 100%
              )
            `
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 pt-32 pb-16 sm:px-8 lg:pt-36 lg:pb-24">

        <div className="flex w-full flex-col items-center text-center">

          <span className="hero-eyebrow mb-5 inline-block rounded-full border border-white/20 bg-white/[0.08] px-5 py-2 font-mono text-[10px] uppercase tracking-[4px] text-white/80 backdrop-blur-sm" style={{ opacity: 0 }}>
            {heroContent.eyebrow}
          </span>

          <h1 className="hero-headline mb-6 font-display font-bold leading-[0.95] tracking-[-3px] text-white" style={{ fontSize: 'clamp(38px, 7vw, 82px)', opacity: 0 }}>
            {heroContent.title}<span className="text-primary-light">.</span>
          </h1>

          <p className="hero-body mx-auto mb-10 max-w-[560px] font-sans text-[16px] leading-[1.8] text-white/70 sm:text-[18px]" style={{ opacity: 0 }}>
            {heroContent.subtitle}
          </p>

          <div className="hero-booking-widget w-full max-w-[800px]" id="booking-bar" style={{ opacity: 0 }}>
            <div className="rounded-[16px] border border-white/10 bg-white/[0.08] p-3 backdrop-blur-xl sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="flex flex-col rounded-[10px] bg-white/[0.08] px-4 py-3 transition-colors hover:bg-white/[0.12]">
                  <label className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[2px] text-white/50">
                    <CalendarDays size={12} />
                    Check In
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => updateParam('checkIn', e.target.value)}
                    className="w-full bg-transparent font-sans text-[14px] font-medium text-white outline-none placeholder:text-white/30 [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>

                <div className="flex flex-col rounded-[10px] bg-white/[0.08] px-4 py-3 transition-colors hover:bg-white/[0.12]">
                  <label className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[2px] text-white/50">
                    <CalendarDays size={12} />
                    Check Out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => updateParam('checkOut', e.target.value)}
                    className="w-full bg-transparent font-sans text-[14px] font-medium text-white outline-none placeholder:text-white/30 [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>

                <div className="flex flex-col rounded-[10px] bg-white/[0.08] px-4 py-3 transition-colors hover:bg-white/[0.12]">
                  <label className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[2px] text-white/50">
                    <Users size={12} />
                    Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => updateParam('guests', e.target.value)}
                    className="w-full appearance-none bg-transparent font-sans text-[14px] font-medium text-white outline-none"
                  >
                    <option value="1" className="text-foreground">1 Guest</option>
                    <option value="2" className="text-foreground">2 Guests</option>
                    <option value="3" className="text-foreground">3 Guests</option>
                    <option value="4" className="text-foreground">4 Guests</option>
                    <option value="5" className="text-foreground">5+ Guests</option>
                  </select>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3 font-sans text-[14px] font-semibold text-primary-foreground transition-all hover:bg-primary-dark hover:shadow-glow active:scale-[0.98] disabled:opacity-70"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {heroContent.ctaText}
                </button>
              </div>
            </div>
          </div>

          <div className="hero-stats mt-12 grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-10">
            {heroContent.stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-display text-[28px] font-semibold text-white opacity-0 sm:text-[34px]" data-counter={stat.value} data-suffix={stat.suffix} data-prefix={stat.prefix}>
                  0
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[3px] text-white/40 opacity-0 sm:text-[10px]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hero-scroll absolute bottom-[28px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 z-20" style={{ opacity: 0 }}>
        <div className="h-[40px] w-px animate-pulse bg-white/40" />
        <span className="font-mono text-[8px] uppercase tracking-[3px] text-white/30">Explore</span>
      </div>
    </section>
  )
}

export function Hero() {
  return (
    <Suspense fallback={
      <section className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-ink" />
    }>
      <HeroInner />
    </Suspense>
  )
}
