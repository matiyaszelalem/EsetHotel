import { Star } from 'lucide-react'
import { query } from '@/lib/db'

export async function Testimonials() {
  let dbTestimonials: { id: string; guest_name: string; comment: string; rating: number }[]
  try {
    dbTestimonials = await query<{
      id: string; guest_name: string; comment: string; rating: number
    }>('SELECT id, guest_name, comment, rating FROM testimonial WHERE active = true ORDER BY sort_order ASC')
  } catch {
    dbTestimonials = []
  }

  const fallbackTestimonials = [
    {
      id: 'fb-1',
      guest_name: 'Amina K.',
      comment: 'Beautiful rooms, excellent service, and a warm welcome from the staff. Highly recommended!',
      rating: 5,
    },
    {
      id: 'fb-2',
      guest_name: 'Samuel B.',
      comment: 'The stay was outstanding — the location is perfect and the attention to detail was exceptional.',
      rating: 5,
    },
    {
      id: 'fb-3',
      guest_name: 'Lina T.',
      comment: 'Great experience from check-in to check-out. The amenities and breakfast were fantastic.',
      rating: 5,
    },
  ]

  const testimonialsToShow = dbTestimonials.length === 0 ? fallbackTestimonials : dbTestimonials

  const displayTestimonials = testimonialsToShow.map((t) => ({
    name: t.guest_name,
    role: 'Verified Guest',
    quote: t.comment,
    initials: t.guest_name.substring(0, 2).toUpperCase(),
    rating: t.rating,
  }))

  return (
    <section id="testimonials" className="w-full bg-background px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="section-header gsap-reveal mb-14 sm:mb-16 flex flex-col items-center text-center">
          <span className="section-heading-eyebrow">TESTIMONIALS</span>
          <h2 className="section-heading-display">
            Loved by guests{' '}
            <br className="hidden sm:block" />
            <span className="text-primary">from around the world.</span>
          </h2>
        </div>

        <div className="animate-cards gsap-reveal grid grid-cols-1 gap-6 lg:grid-cols-3">
          {displayTestimonials.map((t, i) => (
            <div key={i} className="card card-base flex flex-col p-7 sm:p-8">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, si) => (
                  <Star key={si} size={14} className={si < t.rating ? "fill-primary text-primary" : "text-border"} />
                ))}
              </div>
              <p className="mt-5 flex-1 font-sans text-[15px] leading-[1.8] text-foreground">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="my-6 h-px w-full bg-border" />
              <div className="flex items-center gap-3">
                <div className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-full bg-primary/[0.08]">
                  <span className="font-sans text-[14px] font-bold text-primary">{t.initials}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-[15px] font-semibold text-foreground">{t.name}</span>
                  <span className="mt-[2px] font-sans text-[13px] text-muted-foreground">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
