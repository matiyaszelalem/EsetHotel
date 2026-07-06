import {
  Waves, Dumbbell, Sparkles, UtensilsCrossed, Wifi, Car, Wine, ConciergeBell, WashingMachine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { query } from '@/lib/db'

const iconMap: Record<string, LucideIcon> = {
  Waves, Dumbbell, Sparkles, UtensilsCrossed, Wifi, Car, Wine, ConciergeBell, WashingMachine,
}

function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Sparkles
}

const fallbackAmenities = [
  { id: 'fb-1', name: 'Free Wi-Fi', icon: 'Wifi' },
  { id: 'fb-2', name: 'Air Conditioning', icon: 'Wind' },
  { id: 'fb-3', name: 'Pool & Wellness', icon: 'Waves' },
  { id: 'fb-4', name: 'Restaurant', icon: 'UtensilsCrossed' },
  { id: 'fb-5', name: '24/7 Concierge', icon: 'ConciergeBell' },
  { id: 'fb-6', name: 'Laundry Service', icon: 'WashingMachine' },
]

export async function Amenities() {
  const amenitiesData = await query<{
    id: string; name: string; icon: string | null
  }>('SELECT id, name, icon FROM amenity WHERE active = true ORDER BY sort_order ASC')

  const displayAmenities = amenitiesData.length === 0 ? fallbackAmenities : amenitiesData

  return (
    <section id="amenities" className="w-full bg-card px-6 py-24 sm:py-32 overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-[1200px]">
        <div className="section-header gsap-reveal mb-16 flex flex-col items-center text-center">
          <span className="section-heading-eyebrow">AMENITIES</span>
          <h2 className="section-heading-display">
            Everything for an{' '}
            <br className="hidden sm:block" />
            <span className="text-primary">unforgettable stay.</span>
          </h2>
          <p className="mt-4 max-w-[480px] font-sans text-[15px] leading-[1.8] text-muted-foreground">
            World-class facilities designed to make every moment of your stay exceptional —
            from relaxation to recreation.
          </p>
        </div>

        <div className="animate-cards gsap-reveal grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayAmenities.map((amenity, i) => {
            const Icon = getIcon(amenity.icon || '')
            return (
              <div key={amenity.id} className="card card-base group p-6" id={`amenity-${i}`}>
                <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-primary/[0.08] transition-colors group-hover:bg-primary/[0.14]">
                  <Icon size={22} strokeWidth={1.5} className="text-primary" />
                </div>
                <h3 className="mt-4 font-heading text-[16px] font-semibold text-foreground">{amenity.name}</h3>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
