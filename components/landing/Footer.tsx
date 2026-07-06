import Link from 'next/link'
import { queryOne } from '@/lib/db'

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function TripAdvisorIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="12" r="2.5" />
      <circle cx="16" cy="12" r="2.5" />
      <path d="M12 12c0 2 1.5 3 2.5 3s2.5-1 2.5-3" />
      <path d="M12 12c0 2-1.5 3-2.5 3S7 14 7 12" />
    </svg>
  )
}

const exploreLinks = [
  { href: '#hero', label: 'Home' },
  { href: '#rooms', label: 'Rooms & Suites' },
  { href: '#amenities', label: 'Amenities' },
  { href: '#gallery', label: 'Photo Gallery' },
]

const servicesLinks = [
  { href: '#special-offers', label: 'Special Offers' },
  { href: '#location', label: 'Location & Map' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Inquiries' },
]

const policyLinks = [
  { href: '/policies/cancellation', label: 'Cancellation Policy' },
  { href: '#', label: 'Privacy Policy' },
  { href: '#', label: 'Terms of Service' },
  { href: '#', label: 'Cookie Policy' },
]

export async function Footer() {
  const currentYear = new Date().getFullYear()

  const settings = await queryOne<{ address: string | null }>(
    'SELECT address FROM hotel_settings LIMIT 1'
  )
  const hotelAddress = settings?.address || 'Bole Road, Addis Ababa, Ethiopia'

  return (
    <footer className="bg-ink border-t border-ink-border">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-16 sm:px-8 sm:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="flex flex-col items-start">
            <Link href="/" className="inline-flex items-center">
              <span className="font-display text-[20px] font-bold tracking-[-1.5px]">
                <span className="text-white">Eset</span>
                <span className="text-primary">Hotel</span>
              </span>
            </Link>
            <p className="mt-4 font-sans text-[13px] text-white/40 leading-relaxed">
              Experience the perfect blend of modern luxury and authentic Ethiopian hospitality in the heart of Addis Ababa. Your extraordinary stay awaits.
            </p>
            <div className="mt-6 flex items-center gap-5">
              <Link href="#" className="text-white/30 transition-colors hover:text-white" aria-label="Instagram">
                <InstagramIcon className="h-[18px] w-[18px]" />
              </Link>
              <Link href="#" className="text-white/30 transition-colors hover:text-white" aria-label="Facebook">
                <FacebookIcon className="h-[18px] w-[18px]" />
              </Link>
              <Link href="#" className="text-white/30 transition-colors hover:text-white" aria-label="Twitter">
                <TwitterIcon className="h-[18px] w-[18px]" />
              </Link>
              <Link href="#" className="text-white/30 transition-colors hover:text-white" aria-label="TripAdvisor">
                <TripAdvisorIcon className="h-[18px] w-[18px]" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="font-mono text-[10px] uppercase tracking-[4px] text-primary">Explore</h3>
            <ul className="mt-6 flex flex-col gap-[10px]">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-sans text-[14px] text-white/45 transition-colors hover:text-white/90">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="font-mono text-[10px] uppercase tracking-[4px] text-primary">Services</h3>
            <ul className="mt-6 flex flex-col gap-[10px]">
              {servicesLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-sans text-[14px] text-white/45 transition-colors hover:text-white/90">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col">
            <h3 className="font-mono text-[10px] uppercase tracking-[4px] text-primary">Policies</h3>
            <ul className="mt-6 flex flex-col gap-[10px]">
              {policyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="font-sans text-[14px] text-white/45 transition-colors hover:text-white/90">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ink-border pt-8 sm:mt-20 sm:flex-row">
          <p className="font-sans text-[12px] text-white/25 text-center sm:text-left">
            © {currentYear} Eset Hotel. All rights reserved.
          </p>
          <p className="font-sans text-[12px] text-white/25 text-center sm:text-right">
            {hotelAddress}
          </p>
        </div>
      </div>
    </footer>
  )
}
