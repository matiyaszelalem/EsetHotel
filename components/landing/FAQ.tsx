'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FaqEntry {
  id: string
  question: string
  answer: string
  linkText: string | null
  linkHref: string | null
}

export function FAQ() {
  const [faqData, setFaqData] = useState<FaqEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/content/faq')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFaqData(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (loading) {
    return (
      <section id="faq" className="w-full bg-background px-6 py-24 sm:py-32">
        <div className="mx-auto w-full max-w-[800px] animate-pulse">
          <div className="h-12 rounded-[12px] bg-muted/30 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-[92px] rounded-[12px] bg-muted/30" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (faqData.length === 0) {
    const fallbackFaqData: FaqEntry[] = [
      {
        id: 'fallback-1',
        question: 'How do I book a room?',
        answer: 'Use the booking widget at the top of the page or contact our team directly for personalized assistance.',
        linkText: 'View booking policies',
        linkHref: '/policies/cancellation',
      },
      {
        id: 'fallback-2',
        question: 'Is breakfast included?',
        answer: 'Yes, our breakfast buffet is included with most room packages. Some special offers may include additional dining benefits.',
        linkText: null,
        linkHref: null,
      },
      {
        id: 'fallback-3',
        question: 'Do you offer airport transfer?',
        answer: 'We offer airport shuttle service and can arrange transfers upon request. Please include your flight details when booking.',
        linkText: null,
        linkHref: null,
      },
    ]

    return (
      <section id="faq" className="w-full bg-background px-6 py-24 sm:py-32">
        <div className="mx-auto w-full max-w-[800px]">
          <div className="section-header gsap-reveal mb-10 text-center">
            <span className="section-heading-eyebrow">FAQ</span>
            <h2 className="section-heading-display">
              Frequently Asked <span className="text-primary">Questions.</span>
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {fallbackFaqData.map((faq, index) => {
              const isOpen = false
              return (
                <div key={faq.id} className="rounded-[12px] border border-border bg-card">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                  >
                    <span className="flex items-center gap-3 font-heading text-[16px] font-semibold text-foreground">
                      <HelpCircle size={18} className="text-primary flex-shrink-0" />
                      {faq.question}
                    </span>
                  </button>
                  <div className="px-6 pb-6 pt-1 font-sans text-[14px] leading-[1.8] text-muted-foreground">
                    <p>
                      {faq.answer}{' '}
                      {faq.linkText && faq.linkHref && (
                        <Link
                          href={faq.linkHref}
                          className="font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary-dark"
                        >
                          {faq.linkText}
                        </Link>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="faq" className="w-full bg-background px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[800px]">
        {/* Section Header */}
        <div className="section-header gsap-reveal mb-14 text-center">
          <span className="section-heading-eyebrow">
            FAQ
          </span>
          <h2 className="section-heading-display">
            Frequently Asked <span className="text-primary">Questions.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] font-sans text-[15px] leading-[1.8] text-muted-foreground">
            Everything you need to know about your luxury stay at Eset Hotel. Can&apos;t find what you&apos;re looking for? Reach out via our contact form.
          </p>
        </div>

        {/* FAQ Accordion Grid */}
        <div className="flex flex-col gap-4">
          {faqData.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={faq.id}
                className={cn(
                  "rounded-[12px] border transition-all duration-300",
                  isOpen
                    ? "border-primary bg-secondary/30"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3 font-heading text-[16px] font-semibold text-foreground">
                    <HelpCircle size={18} className="text-primary flex-shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "text-muted-foreground transition-transform duration-300 flex-shrink-0 ml-4",
                      isOpen && "rotate-180 text-primary"
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 pt-1 font-sans text-[14px] leading-[1.8] text-muted-foreground">
                      <p>
                        {faq.answer}{' '}
                        {faq.linkText && faq.linkHref && (
                          <Link
                            href={faq.linkHref}
                            className="font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary-dark"
                          >
                            {faq.linkText}
                          </Link>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
