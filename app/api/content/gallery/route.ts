import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

const fallbackGalleryImages = [
  '/images/hotel-lobby.png',
  '/images/bathroom-suite.png',
  '/images/breakfast-cafe.png',
  '/images/dining-experience.png',
  '/images/hotel-facade-night-.png',
  '/images/library-lounge.png',
  '/images/pool-wellness.png',
  '/images/restaurant-dining.png',
]

function isValidImageSrc(src: unknown): src is string {
  if (typeof src !== 'string' || !src.trim()) return false

  try {
    new URL(src)
    return true
  } catch {
    // Not a fully qualified URL, continue to local path validation
  }

  if (!src.startsWith('/images/')) return false

  const imagePath = path.resolve(process.cwd(), 'public', src.replace(/^\//, ''))
  return fs.existsSync(imagePath)
}

function normalizeGalleryItem(item: Record<string, unknown>, index: number) {
  const fallbackSrc = fallbackGalleryImages[index % fallbackGalleryImages.length]

  const srcCandidates = [
    item.src,
    item.image_url,
    item.url,
    item.path,
    item.imagePath,
  ]

  const rawSrc = srcCandidates.find((candidate) => typeof candidate === 'string' && candidate.trim()) as string | undefined
  const src = isValidImageSrc(rawSrc) ? rawSrc : fallbackSrc

  return {
    id: String(item.id ?? `gallery-${index}`),
    src,
    alt: String(item.alt ?? item.caption ?? item.title ?? 'Gallery image'),
    category: String(item.category ?? 'facilities'),
    gridSpan: String(item.gridSpan ?? item.grid_span ?? ''),
  }
}

export async function GET() {
  try {
    const images = await query(
      'SELECT * FROM gallery_image WHERE active = true ORDER BY sort_order ASC'
    )

    const sanitized = Array.isArray(images)
      ? images.map((item, index) => normalizeGalleryItem(item as Record<string, unknown>, index))
      : []

    return NextResponse.json(sanitized)
  } catch (error: any) {
    console.error('Error fetching gallery images:', error)
    return NextResponse.json([])
  }
}
