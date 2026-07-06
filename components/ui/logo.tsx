'use client'

export function Logo({ variant = 'onLight', size = 'default' }: { variant?: 'onDark' | 'onLight'; size?: 'sm' | 'default' }) {
  const textSize = size === 'sm' ? 'text-base' : 'text-[22px]'
  const tracking = size === 'sm' ? 'tracking-[-0.5px]' : 'tracking-[-1.5px]'

  return (
    <span className={`font-display ${textSize} font-bold ${tracking}`}>
      <span className={variant === 'onLight' ? 'text-foreground' : 'text-white'}>
        Eset
      </span>
      <span className="text-primary"> Hotel</span>
    </span>
  )
}
