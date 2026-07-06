import Image from 'next/image'
import { Clock, Percent, Heart } from 'lucide-react'
import Link from 'next/link'
import { query } from '@/lib/db'

const offerIcons = [Clock, Percent, Heart]

const fallbackOfferImages = ['/images/seasonal-offer.png', '/images/spa-package.png']

export async function SpecialOffers() {
  let dbOffers: { id: string; title: string; description: string; discount: string | null }[]
  try {
    dbOffers = await query<{
      id: string; title: string; description: string; discount: string | null
    }>('SELECT id, title, description, discount FROM special_offer WHERE active = true ORDER BY sort_order ASC')
  } catch {
    dbOffers = []
  }

  const fallbackOffers = [
    {
      id: 'fallback-1',
      title: 'Weekend Escape',
      description: 'Enjoy 20% off your stay when you book a weekend getaway with breakfast included.',
      discount: '20% OFF',
    },
    {
      id: 'fallback-2',
      title: 'Spa Retreat',
      description: 'Relax with a complimentary spa treatment when booking two nights or more.',
      discount: 'SPA TREAT',
    },
    {
      id: 'fallback-3',
      title: 'Dining Experience',
      description: 'Receive a complimentary dining credit to explore our signature restaurant.',
      discount: 'DINING CREDIT',
    },
  ]

  const offersToDisplay = dbOffers.length === 0 ? fallbackOffers : dbOffers

  const displayOffers = offersToDisplay.map((o, i) => ({
    title: o.title,
    description: o.description,
    discount: o.discount || 'OFFER',
    icon: offerIcons[i % offerIcons.length],
    color: 'bg-primary/[0.08] text-primary',
    imageUrl: fallbackOfferImages[i % fallbackOfferImages.length],
  }))

  return (
    <section id="special-offers" className="w-full bg-ink px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="section-header gsap-reveal mb-14 flex flex-col items-center text-center">
          <span className="section-heading-eyebrow">SPECIAL OFFERS</span>
          <h2 className="section-heading-display text-white">
            Exclusive deals for{' '}
            <br className="hidden sm:block" />
            <span className="text-primary">our guests.</span>
          </h2>
          <p className="mt-4 max-w-[480px] font-sans text-[15px] leading-[1.8] text-white/50">
            Take advantage of our limited-time offers and make your stay even more special.
          </p>
        </div>

        <div className="animate-cards gsap-reveal grid grid-cols-1 gap-6 sm:grid-cols-3">
          {displayOffers.map((offer, i) => {
            const Icon = offer.icon
            return (
              <div key={i} className="card card-dark group flex flex-col overflow-hidden" id={`offer-${i}`}>
                <div className="relative h-[180px] overflow-hidden">
                  <Image
                    src={offer.imageUrl}
                    alt={offer.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                  <div className="absolute top-4 left-4 flex">
                    <span className={`inline-block rounded-[4px] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[2px] font-semibold ${offer.color}`}>
                      {offer.discount}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-7 sm:p-8">
                <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-white/[0.05] transition-colors group-hover:bg-primary/20">
                  <Icon size={22} strokeWidth={1.5} className="text-primary" />
                </div>
                <h3 className="mt-5 font-heading text-[18px] font-semibold text-white">{offer.title}</h3>
                <p className="mt-2 flex-1 font-sans text-[14px] leading-[1.7] text-white/50">{offer.description}</p>
                <Link
                  href="#booking-bar"
                  className="mt-6 flex w-full items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.05] py-3 font-sans text-[14px] font-semibold text-white transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  id={`offer-book-${i}`}
                >
                  Book This Offer →
                </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
