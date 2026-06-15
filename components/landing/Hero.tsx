'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useGSAP } from '@/lib/hooks/useGSAP'

export function Hero() {
  const container = useRef<HTMLElement>(null)

  useGSAP(
    (gsap) => {
      if (!container.current) return

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      // Animate text elements
      tl.fromTo('.hero-eyebrow',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 }
      )
      .fromTo('.hero-headline',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.60 },
        '-=0.28'
      )
      .fromTo('.hero-body',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45 },
        '-=0.35'
      )
      .fromTo('.hero-cta',
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.40 },
        '-=0.30'
      )
      .fromTo('.hero-stats span',
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.08 },
        '-=0.25'
      )

      // Floating mockup entrance
      tl.fromTo('.hero-mockup',
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.50'
      )

      // Navbar reveal
      gsap.fromTo('.navbar',
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.1 }
      )

      // Scroll indicator
      tl.fromTo('.hero-scroll',
        { opacity: 0 },
        { opacity: 1, duration: 0.35 },
        '-=0.20'
      )

      // Stat counters
      const counters = container.current.querySelectorAll('[data-counter]')
      counters.forEach((counterEl) => {
        const targetValue = parseInt(counterEl.getAttribute('data-counter') || '0', 10)
        const suffix = counterEl.getAttribute('data-suffix') || ''
        const counterObj = { val: 0 }

        gsap.to(counterObj, {
          val: targetValue,
          duration: 1.4,
          ease: 'power1.out',
          snap: { val: 1 },
          delay: 0.8,
          onUpdate: () => {
            counterEl.textContent = `${counterObj.val.toLocaleString()}${suffix}`
          },
        })
      })

      // Gentle floating animation for the mockup
      gsap.to('.hero-mockup', {
        y: -12,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1.5
      })
    },
    []
  )

  return (
    <section ref={container} className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-background">
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 50%, hsl(var(--primary) / 0.04) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 80% 30%, hsl(var(--primary) / 0.03) 0%, transparent 60%),
            linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 40%, hsl(var(--background)) 100%)
          `
        }}
      />

      {/* Decorative grid dots */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center px-6 pt-28 pb-10 sm:px-8 lg:flex-row lg:items-center lg:gap-10 lg:pt-24 lg:pb-16">

        {/* ─── Left: Text Content ─── */}
        <div className="flex w-full flex-col items-center text-center lg:w-[52%] lg:items-start lg:text-left">

          <span className="hero-eyebrow mb-5 inline-block rounded-full border border-primary/20 bg-primary/[0.04] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[4px] text-primary opacity-0">
            Build · Ship · Scale
          </span>

          <h1 className="hero-headline mb-5 font-display font-bold leading-[0.95] tracking-[-3px] text-foreground opacity-0" style={{ fontSize: 'clamp(38px, 6vw, 76px)' }}>
            Ship Products<br />
            That Matter<span className="text-primary">.</span>
          </h1>

          <p className="hero-body mx-auto mb-8 max-w-[480px] font-sans text-[15px] leading-[1.8] text-muted-foreground opacity-0 sm:text-[17px] lg:mx-0">
            The modern platform for teams who build fast, iterate faster, and deliver exceptional digital experiences at scale.
          </p>

          {/* ─── Mobile: Dashboard Mockup ─── */}
          <div className="relative mb-10 flex w-full items-center justify-center lg:hidden">
            <DashboardMockup />
          </div>

          <div className="hero-cta mb-10 flex flex-wrap items-center justify-center gap-3 opacity-0 lg:justify-start">
            <Link
              href="/signup"
              className="btn-primary"
            >
              Start Building — Free
            </Link>
            <Link
              href="#features"
              className="btn-ghost"
            >
              See Features →
            </Link>
          </div>

          {/* Stats bar */}
          <div className="hero-stats grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-10 lg:justify-start">
            <div className="flex flex-col items-center lg:items-start">
              <span className="font-display text-[28px] font-semibold text-foreground opacity-0 sm:text-[34px]" data-counter="10" data-suffix="K+">0</span>
              <span className="font-mono text-[9px] uppercase tracking-[3px] text-muted-foreground opacity-0 sm:text-[10px]">Active Users</span>
            </div>
            <div className="hidden h-[40px] w-px bg-border sm:block" />
            <div className="flex flex-col items-center lg:items-start">
              <span className="font-display text-[28px] font-semibold text-foreground opacity-0 sm:text-[34px]" data-counter="99" data-suffix="%">0</span>
              <span className="font-mono text-[9px] uppercase tracking-[3px] text-muted-foreground opacity-0 sm:text-[10px]">Uptime SLA</span>
            </div>
            <div className="hidden h-[40px] w-px bg-border sm:block" />
            <div className="flex flex-col items-center lg:items-start">
              <span className="font-display text-[28px] font-semibold text-foreground opacity-0 sm:text-[34px]" data-counter="50" data-suffix="M+">0</span>
              <span className="font-mono text-[9px] uppercase tracking-[3px] text-muted-foreground opacity-0 sm:text-[10px]">API Calls / Day</span>
            </div>
            <div className="hidden h-[40px] w-px bg-border sm:block" />
            <div className="flex flex-col items-center lg:items-start">
              <span className="font-display text-[28px] font-semibold text-foreground opacity-0 sm:text-[34px]" data-counter="24" data-suffix="/7">0</span>
              <span className="font-mono text-[9px] uppercase tracking-[3px] text-muted-foreground opacity-0 sm:text-[10px]">Support</span>
            </div>
          </div>
        </div>

        {/* ─── Desktop: Dashboard Mockup ─── */}
        <div className="relative hidden w-full flex-shrink-0 items-center justify-center lg:flex lg:w-[48%]">
          <DashboardMockup />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-[28px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-0 z-20">
        <div className="h-[40px] w-px animate-pulse bg-primary" />
        <span className="font-mono text-[8px] uppercase tracking-[3px] text-primary/40">Scroll</span>
      </div>
    </section>
  )
}

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  return (
    <div className="hero-mockup relative w-full max-w-[520px] opacity-0">
      {/* Decorative glows */}
      <div className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute right-0 top-[20%] h-[50%] w-[50%] rounded-full bg-success/10 blur-[60px]" />

      {/* Main card */}
      <div className="relative overflow-hidden rounded-[20px] border border-border bg-card p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive/60" />
            <div className="h-3 w-3 rounded-full bg-warning/60" />
            <div className="h-3 w-3 rounded-full bg-success/60" />
          </div>
          <div className="h-6 w-[120px] rounded-md bg-muted" />
        </div>

        {/* Dashboard grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-primary/[0.06] p-3">
            <div className="font-mono text-[9px] uppercase tracking-[2px] text-primary mb-1">Revenue</div>
            <div className="font-display text-[18px] font-bold text-foreground sm:text-[22px]">$48.2K</div>
            <div className="font-mono text-[9px] text-success">↑ 12.5%</div>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="font-mono text-[9px] uppercase tracking-[2px] text-muted-foreground mb-1">Users</div>
            <div className="font-display text-[18px] font-bold text-foreground sm:text-[22px]">2,847</div>
            <div className="font-mono text-[9px] text-success">↑ 8.3%</div>
          </div>
          <div className="rounded-xl bg-muted p-3">
            <div className="font-mono text-[9px] uppercase tracking-[2px] text-muted-foreground mb-1">Conv.</div>
            <div className="font-display text-[18px] font-bold text-foreground sm:text-[22px]">5.2%</div>
            <div className="font-mono text-[9px] text-success">↑ 1.1%</div>
          </div>
        </div>

        {/* Chart area placeholder */}
        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-end justify-between h-[80px] sm:h-[100px] gap-2">
            {[35, 55, 42, 68, 52, 78, 62, 88, 72, 95, 82, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-primary/20 transition-all hover:bg-primary/40"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between">
            <span className="font-mono text-[8px] text-muted-foreground">Jan</span>
            <span className="font-mono text-[8px] text-muted-foreground">Jun</span>
            <span className="font-mono text-[8px] text-muted-foreground">Dec</span>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
          <span className="font-sans text-xs font-medium text-foreground">Latest Deployment</span>
          <span className="rounded-md bg-success/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-success">Live</span>
        </div>
      </div>
    </div>
  )
}
