'use client'

import { Check, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const tiers = [
  {
    name: 'Starter',
    badge: 'FREE',
    price: '0',
    period: 'forever · 1 project',
    featured: false,
    features: [
      { name: '1 project', included: true },
      { name: '1,000 API calls/mo', included: true },
      { name: 'Community support', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Custom domain', included: false },
      { name: 'SSO / SAML', included: false },
    ],
    ctaText: 'Start Free',
    ctaHref: '/signup',
  },
  {
    name: 'Pro',
    badge: 'PRO',
    price: '29',
    period: 'per month · billed annually',
    featured: false,
    features: [
      { name: '10 projects', included: true },
      { name: '100K API calls/mo', included: true },
      { name: 'Priority support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom domain', included: true },
      { name: 'Team collaboration', included: true },
    ],
    ctaText: 'Get Pro',
    ctaHref: '/signup',
  },
  {
    name: 'Business',
    badge: 'MOST POPULAR',
    price: '79',
    period: 'per month · billed annually',
    featured: true,
    features: [
      { name: 'Unlimited projects', included: true },
      { name: '1M API calls/mo', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'Custom analytics', included: true },
      { name: 'SSO / SAML', included: true },
      { name: 'SLA guarantee', included: true },
      { name: 'Audit logs', included: true },
      { name: 'Role-based access', included: true },
    ],
    ctaText: 'Get Business',
    ctaHref: '/signup',
  },
  {
    name: 'Enterprise',
    badge: 'ENTERPRISE',
    price: 'Custom',
    period: 'tailored to your needs',
    featured: false,
    features: [
      { name: 'Unlimited everything', included: true },
      { name: 'White label', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated infra', included: true },
      { name: 'On-premise option', included: true },
      { name: '24/7 phone support', included: true },
      { name: 'Custom SLA', included: true },
    ],
    ctaText: 'Contact Sales',
    ctaHref: '#contact',
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="w-full bg-card px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Section Header */}
        <div className="section-header mb-14 flex flex-col items-center text-center">
          <span className="section-heading-eyebrow">
            PRICING
          </span>
          <h2 className="section-heading-display">
            Simple, <span className="text-primary">transparent pricing.</span>
          </h2>
          <p className="mt-4 max-w-[460px] font-sans text-[15px] leading-[1.8] text-muted-foreground">
            Start free, scale as you grow. No hidden fees, no surprises. Cancel anytime.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="animate-cards grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={cn(
                'card relative flex flex-col rounded-[14px] p-7 sm:p-8',
                tier.featured
                  ? 'bg-ink text-white ring-2 ring-primary lg:scale-[1.03] lg:z-10 shadow-[0_16px_48px_rgba(0,0,0,0.2)]'
                  : 'card-base'
              )}
            >
              {/* Badge */}
              <div className="mb-5 flex">
                <span className={cn(
                  'inline-block rounded-[4px] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[2px] font-semibold',
                  tier.featured
                    ? 'bg-primary text-primary-foreground'
                    : tier.name === 'Starter'
                      ? 'bg-foreground/[0.06] text-muted-foreground'
                      : 'bg-primary/[0.08] text-primary'
                )}>
                  {tier.badge}
                </span>
              </div>

              {/* Name */}
              <h3 className={cn(
                'font-heading text-[20px] font-semibold sm:text-[22px]',
                tier.featured ? 'text-white' : 'text-foreground'
              )}>
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className={cn(
                  'font-display text-[40px] font-bold leading-none tracking-[-1px] sm:text-[44px]',
                  tier.featured ? 'text-white' : 'text-foreground'
                )}>
                  {tier.price === 'Custom' ? '' : '$'}{tier.price}
                </span>
                {tier.price !== 'Custom' && (
                  <span className={cn(
                    'font-sans text-[15px]',
                    tier.featured ? 'text-white/50' : 'text-muted-foreground'
                  )}>
                    /mo
                  </span>
                )}
              </div>

              {/* Period */}
              <span className={cn(
                'mb-6 mt-1 font-sans text-[13px]',
                tier.featured ? 'text-white/40' : 'text-muted-foreground'
              )}>
                {tier.period}
              </span>

              {/* Divider */}
              <div className={cn(
                'h-px w-full',
                tier.featured ? 'bg-white/10' : 'bg-border'
              )} />

              {/* Features */}
              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check size={15} strokeWidth={2.5} className={cn(
                        'mt-0.5 flex-shrink-0',
                        tier.featured ? 'text-primary-light' : 'text-primary'
                      )} />
                    ) : (
                      <X size={15} strokeWidth={2} className={cn(
                        'mt-0.5 flex-shrink-0 opacity-30',
                        tier.featured ? 'text-white' : 'text-muted-foreground'
                      )} />
                    )}
                    <span className={cn(
                      'font-sans text-[14px]',
                      tier.featured
                        ? (feature.included ? 'text-white/80' : 'text-white/25')
                        : (feature.included ? 'text-foreground' : 'text-muted-foreground/50')
                    )}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                className={cn(
                  'mt-8 flex w-full items-center justify-center rounded-[8px] py-3 font-sans text-[14px] font-bold transition-all',
                  tier.featured
                    ? 'bg-primary text-primary-foreground hover:bg-primary-dark hover:shadow-glow'
                    : tier.name === 'Starter'
                      ? 'border border-border bg-background text-foreground hover:border-primary hover:text-primary'
                      : 'bg-primary text-primary-foreground hover:bg-primary-dark hover:shadow-glow'
                )}
              >
                {tier.ctaText} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
