import { cn } from '@/lib/utils'

interface ImagePlaceholderProps {
  className?: string
  aspectRatio?: string
  iconSize?: number
}

export function ImagePlaceholder({ className, aspectRatio = '4/3', iconSize = 32 }: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground/40',
        className
      )}
      style={{ aspectRatio }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-60"
      >
        {/* Hotel building */}
        <rect x="3" y="4" width="18" height="16" rx="1" />
        <path d="M9 20v-4h6v4" />
        <path d="M7 8h2" />
        <path d="M11 8h2" />
        <path d="M15 8h2" />
        <path d="M7 12h2" />
        <path d="M11 12h2" />
        <path d="M15 12h2" />
        {/* Sun */}
        <circle cx="19" cy="5" r="2" fill="currentColor" opacity="0.3" />
        {/* Decorative line */}
        <path d="M4 18h16" strokeOpacity="0.3" />
      </svg>
      <span className="sr-only">Image placeholder</span>
    </div>
  )
}

// A vertical variant for hero sections
export function HeroImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink via-ink-card to-ink',
        className
      )}
    >
      {/* Decorative pattern */}
      <div className="relative w-full h-full">
        <svg
          className="absolute inset-0 w-full h-full text-white/[0.03]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width={64}
            height={64}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-10"
          >
            <rect x="3" y="4" width="18" height="16" rx="1" />
            <path d="M9 20v-4h6v4" />
            <path d="M7 8h2" />
            <path d="M11 8h2" />
            <path d="M15 8h2" />
            <path d="M7 12h2" />
            <path d="M11 12h2" />
            <path d="M15 12h2" />
            <circle cx="19" cy="5" r="2" fill="white" opacity="0.15" />
          </svg>
        </div>
      </div>
    </div>
  )
}
