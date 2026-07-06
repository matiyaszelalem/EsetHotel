'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type GalleryCategory = 'all' | 'rooms' | 'dining' | 'facilities'

interface GalleryImage {
  id: string
  src: string
  alt: string
  category: string
  gridSpan: string
}

const categories: { key: GalleryCategory; label: string }[] = [
  { key: 'all', label: 'All Photos' },
  { key: 'rooms', label: 'Rooms & Suites' },
  { key: 'dining', label: 'Dining' },
  { key: 'facilities', label: 'Facilities' },
]

const fallbackGalleryImages: GalleryImage[] = [
  { id: 'fb-1', src: '/images/hotel-lobby.png', alt: 'Grand Hotel Lobby', category: 'facilities', gridSpan: 'sm:col-span-2 sm:row-span-2' },
  { id: 'fb-2', src: '/images/bathroom-suite.png', alt: 'Luxury Bathroom Suite', category: 'rooms', gridSpan: '' },
  { id: 'fb-3', src: '/images/breakfast-cafe.png', alt: 'Breakfast Cafe', category: 'dining', gridSpan: '' },
  { id: 'fb-4', src: '/images/dining-experience.png', alt: 'Exquisite Dining Experience', category: 'dining', gridSpan: '' },
  { id: 'fb-5', src: '/images/hotel-facade-night-.png', alt: 'Hotel Façade at Night', category: 'facilities', gridSpan: '' },
  { id: 'fb-6', src: '/images/library-lounge.png', alt: 'Library Lounge', category: 'facilities', gridSpan: '' },
  { id: 'fb-7', src: '/images/pool-wellness.png', alt: 'Pool & Wellness Center', category: 'facilities', gridSpan: '' },
  { id: 'fb-8', src: '/images/restaurant-dining.png', alt: 'Restaurant Dining Area', category: 'dining', gridSpan: '' },
  { id: 'fb-9', src: '/images/rooftop-terrace.png', alt: 'Rooftop Terrace', category: 'facilities', gridSpan: '' },
  { id: 'fb-10', src: '/images/spa-interior.png', alt: 'Spa & Wellness Interior', category: 'facilities', gridSpan: '' },
  { id: 'fb-11', src: '/images/hotel-corridor.png', alt: 'Elegant Hotel Corridor', category: 'facilities', gridSpan: '' },
]

export function Gallery() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(fallbackGalleryImages)
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/content/gallery')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: Record<string, unknown>) => ({
            id: String(item.id ?? ''),
            src: String(item.src ?? item.image_url ?? item.url ?? ''),
            alt: String(item.alt ?? item.alt_text ?? item.caption ?? ''),
            category: String(item.category ?? 'facilities'),
            gridSpan: String(item.gridSpan ?? item.grid_span ?? ''),
          })).filter((img: GalleryImage) => img.src.length > 0)
          if (mapped.length > 0) setGalleryImages(mapped)
        }
      })
      .catch(() => {})
  }, [])

  const filteredImages = activeCategory === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeCategory)

  const imagesToRender = filteredImages.length > 0 ? filteredImages : fallbackGalleryImages

  const getFallbackGallerySrc = (index: number) =>
    fallbackGalleryImages[index % fallbackGalleryImages.length].src

  const handleGalleryImageError = (index: number) => {
    setGalleryImages((current) =>
      current.map((img, idx) =>
        idx === index
          ? { ...img, src: getFallbackGallerySrc(idx) }
          : img
      )
    )
  }

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % imagesToRender.length)
    }
  }
  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + imagesToRender.length) % imagesToRender.length)
    }
  }

  return (
    <section id="gallery" className="w-full bg-background px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Section Header */}
        <div className="section-header gsap-reveal mb-10 flex flex-col items-center text-center">
          <span className="section-heading-eyebrow">
            GALLERY
          </span>
          <h2 className="section-heading-display">
            A glimpse of{' '}
            <br className="hidden sm:block" />
            <span className="text-primary">luxury living.</span>
          </h2>
          <p className="mt-4 max-w-[480px] font-sans text-[15px] leading-[1.8] text-muted-foreground">
            Explore our beautifully designed spaces — from elegant rooms to world-class facilities.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2" id="gallery-filters">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'rounded-full px-5 py-2 font-sans text-[13px] font-medium transition-all',
                activeCategory === cat.key
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-muted text-muted-foreground hover:bg-primary/[0.08] hover:text-primary'
              )}
              id={`gallery-filter-${cat.key}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="animate-cards gsap-reveal grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {imagesToRender.map((image, i) => (
            <div
              key={image.id}
              className={cn(
                'card group relative cursor-pointer overflow-hidden rounded-[12px]',
                image.gridSpan || ''
              )}
              onClick={() => openLightbox(i)}
              id={`gallery-image-${i}`}
            >
              <div className="relative h-[180px] sm:h-[220px] lg:h-[260px] w-full">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onError={() => handleGalleryImageError(i)}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="p-4 font-sans text-[13px] font-medium text-white">
                    {image.alt}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal — rendered via portal on document.body */}
      {lightboxIndex !== null && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div
            className="flex h-full w-full items-center justify-center bg-ink/90 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close lightbox"
              id="lightbox-close"
            >
              <X size={20} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); prevImage() }}
              className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-8"
              aria-label="Previous image"
              id="lightbox-prev"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage() }}
              className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-8"
              aria-label="Next image"
              id="lightbox-next"
            >
              <ChevronRight size={24} />
            </button>

            <div
              className="relative mx-auto max-h-[80vh] max-w-[90vw] sm:max-w-[80vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={imagesToRender[lightboxIndex].src}
                alt={imagesToRender[lightboxIndex].alt}
                width={1200}
                height={800}
                className="max-h-[80vh] w-auto rounded-lg object-contain"
                sizes="(max-width: 640px) 90vw, 80vw"
              />
              <p className="mt-4 text-center font-sans text-[14px] text-white/70">
                {imagesToRender[lightboxIndex].alt}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
