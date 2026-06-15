import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'line' | 'block' | 'circle'
}

export function Skeleton({ className, variant = 'block' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-[skeleton-shimmer_1.5s_infinite] bg-[linear-gradient(90deg,hsl(var(--muted))_25%,hsl(var(--background))_50%,hsl(var(--muted))_75%)] bg-[length:200%_100%]',
        variant === 'circle' ? 'rounded-full' : 'rounded-md',
        variant === 'line' ? 'h-4 w-full' : null,
        className,
      )}
    />
  )
}
