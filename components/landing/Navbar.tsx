'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGSAP } from '@/lib/hooks/useGSAP'

/* ─── Nav data ─── */
const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#contact', label: 'Contact' },
]

/* ─── Logo (inline) ─── */
function Logo({ variant }: { variant: 'onDark' | 'onLight' }) {
  return (
    <span className="font-display text-[20px] font-bold tracking-[-1.5px]">
      <span className={variant === 'onLight' ? 'text-foreground' : 'text-white'}>
        Project
      </span>
      <span className="text-primary">Name</span>
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  /* ─── Scroll listener with rAF ─── */
  const handleScroll = useCallback(() => {
    requestAnimationFrame(() => {
      setScrolled(window.scrollY >= 80)
    })
  }, [])

  useEffect(() => {
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  /* ─── Lock body scroll when mobile menu is open ─── */
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  /* ─── GSAP mobile menu animation ─── */
  useGSAP(
    (gsap) => {
      if (!isMenuOpen || !overlayRef.current) return

      const tl = gsap.timeline()

      tl.from(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
      })
        .from('.mobile-menu-link', {
          x: -22,
          opacity: 0,
          duration: 0.32,
          stagger: 0.055,
          ease: 'power2.out',
        }, '-=0.05')
        .from('.mobile-menu-footer', {
          opacity: 0,
          duration: 0.2,
        }, '-=0.1')

      return () => {
        tl.kill()
      }
    },
    [isMenuOpen]
  )

  return (
    <>
      {/* ─── Fixed navbar ─── */}
      <header
        className={cn(
          'navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-background/[0.88] border-b border-border backdrop-blur-[14px]'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo — left */}
          <Link href="/" className="inline-flex items-center">
            <Logo variant="onLight" />
          </Link>

          {/* Desktop nav — center */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-sans text-[14px] font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth — right */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 font-sans text-[14px] font-medium text-foreground transition-colors hover:text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger — right */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center justify-center lg:hidden h-11 w-11 rounded-md"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-foreground transition-colors" />
          </button>
        </div>
      </header>

      {/* ─── Mobile full-screen overlay ─── */}
      {isMenuOpen && (
        <div
          ref={overlayRef}
          className="mobile-overlay fixed inset-0 z-[60] flex flex-col bg-ink"
        >
          {/* Top bar */}
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <Logo variant="onDark" />
            <button
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center justify-center h-11 w-11 rounded-md"
              aria-label="Close menu"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Nav links — stacked */}
          <nav className="flex flex-1 flex-col items-start justify-center gap-6 px-8">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setIsMenuOpen(false)}
                className="mobile-menu-link font-display text-[32px] font-semibold tracking-[-0.5px] text-white/90 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Bottom — CTA */}
          <div className="mobile-menu-footer flex flex-col gap-3 px-8 pb-10">
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="flex h-12 items-center justify-center rounded-[6px] border border-white/20 font-sans text-[15px] font-medium text-white transition-colors hover:border-white/60 hover:bg-white/5"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsMenuOpen(false)}
              className="flex h-12 items-center justify-center rounded-[6px] bg-primary font-sans text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary-dark"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
