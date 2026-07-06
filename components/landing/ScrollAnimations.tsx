'use client'

import { useGSAP } from '@/lib/hooks/useGSAP'

export function ScrollAnimations() {
  useGSAP((gsap, ScrollTrigger) => {
    gsap.set('.gsap-reveal', { opacity: 1, y: 0 })

    const prep = (targets: Element[] | Element | string) => {
      gsap.set(targets, { willChange: 'transform, opacity' })
    }
    const clear = (targets: Element[] | Element | string) => {
      gsap.set(targets, { clearProps: 'willChange' })
    }

    const revealAllContent = () => {
      const heroTargets = [
        '.hero-eyebrow',
        '.hero-headline',
        '.hero-body',
        '.hero-booking-widget',
        '.hero-stats span',
        '.hero-scroll',
      ].join(',')

      gsap.set('.gsap-reveal, .animate-cards .card, .card-base, .card-dark', {
        opacity: 1,
        y: 0,
        clearProps: 'all',
      })
      gsap.set(heroTargets, {
        opacity: 1,
        y: 0,
        clearProps: 'all',
      })
      ScrollTrigger.refresh()
    }

    const onFirstClick = () => {
      revealAllContent()
      document.removeEventListener('click', onFirstClick)
    }

    document.addEventListener('click', onFirstClick, { passive: true })

    // ─── Section headers (all sections) ───
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

    // ─── Cards on light backgrounds (Rooms, Amenities, Gallery, Testimonials) ───
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

    // ─── Cards on dark "ink" backgrounds (SpecialOffers) ───
    ScrollTrigger.batch('.bg-ink .animate-cards .card', {
      start: 'top 85%',
      once: true,
      onEnter: (batch: Element[]) => {
        prep(batch)
        gsap.fromTo(batch,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            onComplete: () => clear(batch),
          }
        )
      },
    })

    // ─── Location section: map + info cards stagger ───
    const locationSection = document.getElementById('location')
    if (locationSection) {
      const mapContainer = locationSection.querySelector('.lg\\:col-span-7')
      const infoContainer = locationSection.querySelector('.lg\\:col-span-5')

      if (mapContainer) {
        prep(mapContainer)
        gsap.fromTo(mapContainer,
          { x: -30, opacity: 0 },
          {
            scrollTrigger: { trigger: locationSection, start: 'top 82%', once: true },
            x: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => clear(mapContainer),
          }
        )
      }

      if (infoContainer) {
        const cards = Array.from(infoContainer.querySelectorAll('.card-base'))
        if (cards.length) {
          prep(cards)
          gsap.fromTo(cards,
            { x: 24, opacity: 0 },
            {
              scrollTrigger: { trigger: locationSection, start: 'top 82%', once: true },
              x: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.12,
              delay: 0.15,
              ease: 'power2.out',
              onComplete: () => clear(cards),
            }
          )
        }
      }
    }

    // ─── FAQ section: accordion items stagger ───
    const faqSection = document.getElementById('faq')
    if (faqSection) {
      const faqItems = Array.from(faqSection.querySelectorAll('[class*="rounded-\\[12px\\]"]'))
      if (faqItems.length) {
        prep(faqItems)
        gsap.fromTo(faqItems,
          { y: 18, opacity: 0 },
          {
            scrollTrigger: { trigger: faqSection, start: 'top 82%', once: true },
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.06,
            ease: 'power2.out',
            onComplete: () => clear(faqItems),
          }
        )
      }
    }

    // ─── Contact section: slide-in from left/right ───
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

    // ─── Gallery grid: stagger reveal ───
    const gallerySection = document.getElementById('gallery')
    if (gallerySection) {
      const filterBtns = Array.from(gallerySection.querySelectorAll('[id^="gallery-filter-"]'))
      if (filterBtns.length) {
        prep(filterBtns)
        gsap.fromTo(filterBtns,
          { y: 10, opacity: 0 },
          {
            scrollTrigger: { trigger: gallerySection, start: 'top 85%', once: true },
            y: 0,
            opacity: 1,
            duration: 0.35,
            stagger: 0.06,
            ease: 'power2.out',
            onComplete: () => clear(filterBtns),
          }
        )
      }
    }
  }, [])

  return null
}
