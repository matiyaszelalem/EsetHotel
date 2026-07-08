import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

const fallbackHeroImage = '/images/hero-background.png'

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

function sanitizeHeroContent(content: Record<string, unknown>) {
  const heroContent = {
    eyebrow: String(content.eyebrow ?? 'Welcome to Eset Hotel'),
    title: String(content.title ?? 'Your Premier Stay in Addis Ababa'),
    subtitle: String(content.subtitle ?? 'Experience luxury, comfort, and exceptional hospitality in the heart of the city.'),
    ctaText: String(content.ctaText ?? 'Check Availability'),
    imageUrl: String(content.imageUrl ?? fallbackHeroImage),
    stats: Array.isArray(content.stats) ? content.stats : [],
  }

  if (!isValidImageSrc(heroContent.imageUrl)) {
    heroContent.imageUrl = fallbackHeroImage
  }

  return heroContent
}

export async function GET() {
  try {
    const settings = await queryOne<{ hero_content: string | null }>(
      'SELECT hero_content FROM hotel_settings LIMIT 1'
    )
    if (!settings?.hero_content) {
      return NextResponse.json(null)
    }

    const parsed = JSON.parse(settings.hero_content)
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json(null)
    }

    const response = NextResponse.json(sanitizeHeroContent(parsed as Record<string, unknown>))
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    return response
  } catch (error: any) {
    console.error('Error fetching hero content:', error)
    return NextResponse.json(null)
  }
}
