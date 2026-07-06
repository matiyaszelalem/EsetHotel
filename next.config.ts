import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    deviceSizes: [640, 750, 1080, 1920],
    formats: ['image/webp'],
  },
}

export default nextConfig
