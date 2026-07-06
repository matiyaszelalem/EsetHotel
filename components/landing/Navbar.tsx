'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Menu, X, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGSAP } from '@/lib/hooks/useGSAP'
import { Logo } from '@/components/ui/logo'

/* ─── Nav data ─── */
const navLinks = [
  { href: '#rooms', label: 'Rooms' },
  { href: '#amenities', label: 'Amenities' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#testimonials', label: 'Reviews' },
  { href: '#contact', label: 'Contact' },
]

/* ═══════════════════════════════════════════════════════════════════════════ */

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  /* ─── Fetch phone from settings ─── */
  useEffect(() => {
    fetch('/api/content/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.contactPhone) setPhoneNumber(data.contactPhone)
      })
      .catch(() => {})
  }, [])

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
            ? 'bg-background/[0.92] border-b border-border backdrop-blur-[14px] shadow-sm'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo — left */}
          <Link href="/" className="inline-flex items-center" id="navbar-logo">
            <Logo variant={scrolled ? 'onLight' : 'onDark'} />
          </Link>

          {/* Desktop nav — center */}
          <nav className="hidden items-center gap-8 lg:flex" id="navbar-desktop-nav">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'font-sans text-[14px] font-medium transition-colors',
                  scrolled
                    ? 'text-muted-foreground hover:text-primary'
                    : 'text-white/80 hover:text-white'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop actions — right */}
          <div className="hidden items-center gap-3 lg:flex">
            {phoneNumber && (
              <a
                href={`tel:${phoneNumber.replace(/\s/g, '')}`}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 font-sans text-[13px] font-medium transition-colors',
                  scrolled
                    ? 'text-muted-foreground hover:text-primary'
                    : 'text-white/70 hover:text-white'
                )}
                id="navbar-phone"
              >
                <Phone size={14} strokeWidth={1.5} />
                {phoneNumber}
              </a>
            )}
            <Link
              href="#booking-bar"
              className="btn-primary"
              id="navbar-book-now"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile hamburger — right */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center justify-center lg:hidden h-11 w-11 rounded-md"
            aria-label="Open menu"
            id="navbar-mobile-toggle"
          >
            <Menu className={cn('h-6 w-6 transition-colors', scrolled ? 'text-foreground' : 'text-white')} />
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
          <div className="flex h-[72px] items-center justify-between px-4 sm:px-6">
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
            {phoneNumber && (
              <a
                href={`tel:${phoneNumber.replace(/\s/g, '')}`}
                onClick={() => setIsMenuOpen(false)}
                className="flex h-12 items-center justify-center gap-2 rounded-[6px] border border-white/20 font-sans text-[15px] font-medium text-white transition-colors hover:border-white/60 hover:bg-white/5"
              >
                <Phone size={16} />
                Call Us
              </a>
            )}
            <Link
              href="#booking-bar"
              onClick={() => setIsMenuOpen(false)}
              className="flex h-12 items-center justify-center rounded-[6px] bg-primary font-sans text-[13px] font-semibold text-primary-foreground transition-all hover:bg-primary-dark"
            >
              Book Your Stay
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
