import { Star } from 'lucide-react'

const testimonialsData = [
  {
    name: 'Sarah Chen',
    role: 'CTO · Acme Corp',
    quote: 'We migrated our entire infrastructure and saw a 40% reduction in latency overnight. The developer experience is unmatched.',
    initials: 'SC',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Lead Engineer · Globex',
    quote: 'The API design is elegant and the documentation is pristine. We integrated it into our pipeline in under a day. Truly enterprise-ready.',
    initials: 'MR',
  },
  {
    name: 'Emily Nakamura',
    role: 'VP Engineering · Stark Industries',
    quote: 'Finally a platform that scales with us. From 10K to 10M users — zero downtime, zero headaches. Their support team is exceptional.',
    initials: 'EN',
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="w-full bg-background px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Section Header */}
        <div className="section-header mb-14 sm:mb-16 flex flex-col items-center text-center">
          <span className="section-heading-eyebrow">
            TESTIMONIALS
          </span>
          <h2 className="section-heading-display">
            Loved by teams{' '}
            <br className="hidden sm:block" />
            <span className="text-primary">around the world.</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="animate-cards grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonialsData.map((t, i) => (
            <div
              key={i}
              className="card card-base flex flex-col p-7 sm:p-8"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, si) => (
                  <Star key={si} size={14} className="fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="mt-5 flex-1 font-sans text-[15px] leading-[1.8] text-foreground">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Divider */}
              <div className="my-6 h-px w-full bg-border" />

              {/* Bottom Row */}
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-full bg-primary/[0.08]">
                  <span className="font-sans text-[14px] font-bold text-primary">
                    {t.initials}
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-col">
                  <span className="font-heading text-[15px] font-semibold text-foreground">
                    {t.name}
                  </span>
                  <span className="mt-[2px] font-sans text-[13px] text-muted-foreground">
                    {t.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
