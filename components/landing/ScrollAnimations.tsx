'use client'

import { useGSAP } from '@/lib/hooks/useGSAP'

export function ScrollAnimations() {
  useGSAP((gsap, ScrollTrigger) => {
    const prep = (targets: Element[] | Element | string) => {
      gsap.set(targets, { willChange: 'transform, opacity' })
    }
    const clear = (targets: Element[] | Element | string) => {
      gsap.set(targets, { clearProps: 'willChange' })
    }

    // Section headers
    document.querySelectorAll('.section-header').forEach((header) => {
      const children = Array.from(header.children)
      prep(children)
      gsap.fromTo(children,
        { y: 20, opacity: 0 },
        {
          scrollTrigger: { trigger: header, start: 'top 88%', once: true },
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          onComplete: () => clear(children),
        }
      )
    })

    // Cards on light backgrounds
    ScrollTrigger.batch('section:not(.bg-ink) .animate-cards .card', {
      start: 'top 85%',
      once: true,
      onEnter: (batch: Element[]) => {
        prep(batch)
        const featured = batch.filter((card) => card.classList.contains('bg-ink') || card.classList.contains('ring-2'))
        const regular = batch.filter((card) => !card.classList.contains('bg-ink') && !card.classList.contains('ring-2'))
        if (regular.length) {
          gsap.fromTo(regular,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.45,
              stagger: 0.07,
              ease: 'power2.out',
              onComplete: () => clear(regular),
            }
          )
        }
        if (featured.length) {
          gsap.fromTo(
            featured,
            { y: 24, opacity: 0, scale: 0.97 },
            {
              y: 0,
              opacity: 1,
              scale: 1.05,
              duration: 0.5,
              stagger: 0.1,
              ease: 'power2.out',
              onComplete: () => clear(featured),
            },
          )
        }
      },
    })

    // Trust bar
    const trustBar = document.querySelector('.trust-bar')
    if (trustBar) {
      prep(trustBar)
      gsap.fromTo(trustBar,
        { opacity: 0, y: 16 },
        {
          scrollTrigger: { trigger: trustBar, start: 'top 90%', once: true },
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => clear(trustBar),
        }
      )
    }

    // Contact section slide-in
    const contactHeader = Array.from(document.querySelectorAll('.section-header')).find((header) =>
      header.textContent?.includes('CONTACT'),
    )
    const contactSection = contactHeader?.closest('section')
    const contactLeft = contactSection?.querySelector('.lg\\:col-span-5')
    const contactRight = contactSection?.querySelector('.lg\\:col-span-7')
    if (contactSection && contactLeft && contactRight) {
      prep([contactLeft, contactRight])
      gsap.fromTo(contactLeft,
        { x: -24, opacity: 0 },
        {
          scrollTrigger: { trigger: contactSection, start: 'top 85%', once: true },
          x: 0,
          opacity: 1,
          duration: 0.55,
          ease: 'power2.out',
          onComplete: () => clear(contactLeft),
        }
      )
      gsap.fromTo(contactRight,
        { x: 24, opacity: 0 },
        {
          scrollTrigger: { trigger: contactSection, start: 'top 85%', once: true },
          x: 0,
          opacity: 1,
          duration: 0.55,
          delay: 0.15,
          ease: 'power2.out',
          onComplete: () => clear(contactRight),
        }
      )
    }
  }, [])

  return null
}
