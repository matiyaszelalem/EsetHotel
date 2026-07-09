import Image from 'next/image'
import Link from 'next/link'
import { Users, Maximize, Wifi, Wind, Coffee, Bath } from 'lucide-react'
import { getEtbRate, formatDualPrice } from '@/lib/dual-pricing'
import { query } from '@/lib/db'
import type { LucideIcon } from 'lucide-react'

function roomImage(slug: string): string {
  const known: Record<string, string> = {
    'standard-room': '/images/standard-room.png',
    'deluxe-room': '/images/deluxe-room.png',
    'executive-suite': '/images/executive-suite.png',
    'family-room': '/images/family-room.png',
    'presidential-suite': '/images/presidential-suite.png',
  }
  return known[slug] || '/images/hotel-corridor.png'
}

const amenityIconMap: Record<string, LucideIcon> = {
  'Free Wi-Fi': Wifi,
  'Air Conditioning': Wind,
  'Mini Bar': Coffee,
  'Rain Shower': Bath,
  'Bathtub': Bath,
  'Full Bar': Coffee,
  'Jacuzzi': Bath,
}

function getIcon(amenity: string): LucideIcon {
  return amenityIconMap[amenity] || Wifi
}

function getRoomSize(capacity: number): string {
  const sizes: Record<number, string> = { 1: '22', 2: '28', 3: '38', 4: '52' }
  return `${sizes[capacity] || '28'} m²`
}

const fallbackRoomTypes = [
  {
    id: 'standard',
    slug: 'standard-room',
    name: 'Standard Room',
    description: 'A comfortable room with city views, modern amenities, and restful luxury.',
    base_price: 110,
    capacity: 2,
    bed_config: 'King Bed',
    amenities: JSON.stringify(['Free Wi-Fi', 'Air Conditioning', 'Mini Bar']),
    images: '[]',
  },
  {
    id: 'deluxe',
    slug: 'deluxe-room',
    name: 'Deluxe Room',
    description: 'Spacious accommodations with premium finishes and an elegant design.',
    base_price: 185,
    capacity: 2,
    bed_config: 'King Bed',
    amenities: JSON.stringify(['Free Wi-Fi', 'Air Conditioning', 'Rain Shower']),
    images: '[]',
  },
  {
    id: 'executive',
    slug: 'executive-suite',
    name: 'Executive Suite',
    description: 'A luxurious suite with separate living space and elevated comforts.',
    base_price: 285,
    capacity: 3,
    bed_config: 'King Bed + Sofa Bed',
    amenities: JSON.stringify(['Free Wi-Fi', 'Air Conditioning', 'Mini Bar', 'Jacuzzi']),
    images: '[]',
  },
]

export async function Rooms() {
  let roomTypes: (typeof fallbackRoomTypes[number])[]
  try {
    const rows = await query<{
      id: string; slug: string; name: string; description: string | null
      base_price: number; capacity: number; bed_config: string | null
      amenities: string | null; images: string | null
    }>('SELECT * FROM room_type ORDER BY base_price ASC')
    roomTypes = rows.length > 0
      ? rows.map(r => ({
          id: r.id, slug: r.slug, name: r.name,
          description: r.description ?? '',
          base_price: r.base_price, capacity: r.capacity,
          bed_config: r.bed_config ?? 'King Bed',
          amenities: r.amenities ?? '[]',
          images: r.images ?? '[]',
        }))
      : fallbackRoomTypes
  } catch {
    roomTypes = fallbackRoomTypes
  }

  const etbRate = await getEtbRate()

  const displayRooms = roomTypes

  const featuredRoomId = displayRooms.reduce((prev, curr) =>
    curr.base_price > prev.base_price ? curr : prev
  ).id

  return (
    <section id="rooms" className="w-full bg-background px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="section-header gsap-reveal mb-16 flex flex-col items-center text-center">
          <span className="section-heading-eyebrow">ACCOMMODATIONS</span>
          <h2 className="section-heading-display">
            Find your perfect{' '}
            <br className="hidden sm:block" />
            <span className="text-primary">room & suite.</span>
          </h2>
          <p className="mt-4 max-w-[520px] font-sans text-[15px] leading-[1.8] text-muted-foreground">
            From comfortable standard rooms to our breathtaking Presidential Suite,
            every space is designed for an unforgettable stay.
          </p>
        </div>

        <div className="animate-cards gsap-reveal grid grid-cols-1 gap-6 sm:grid-cols-2">
          {roomTypes.map((room, i) => {
            const amenities: string[] = JSON.parse(room.amenities || '[]')
            const isFeatured = room.id === featuredRoomId

            return (
              <div
                key={room.id}
                className="card card-base group overflow-hidden"
                id={`room-card-${room.slug}`}
              >
                <div className="relative overflow-hidden h-[240px]">
                  <Image
                    src={roomImage(room.slug)}
                    alt={room.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute top-4 right-4 rounded-lg bg-ink/80 px-3 py-1.5 backdrop-blur-sm">
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-white/60">From </span>
                    <span className="font-display text-[18px] font-bold text-white">${room.base_price}</span>
                    <span className="font-sans text-[12px] text-white/50">/night</span>
                    <div className="mt-0.5 font-mono text-[9px] text-white/40 tracking-[0.5px]">
                      ≈ {formatDualPrice(room.base_price, etbRate).etbShort}/night
                    </div>
                  </div>
                  {isFeatured && (
                    <div className="absolute top-4 left-4 rounded-[4px] bg-primary px-2.5 py-1 font-mono text-[9px] uppercase tracking-[2px] font-semibold text-primary-foreground">
                      Most Popular
                    </div>
                  )}
                </div>

                <div className="flex flex-col p-6 sm:p-7">
                  <h3 className="font-heading text-[20px] font-semibold text-foreground sm:text-[22px]">
                    {room.name}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground">
                      <Users size={13} strokeWidth={1.5} className="text-primary" />
                      {room.capacity} Guests
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground">
                      <Maximize size={13} strokeWidth={1.5} className="text-primary" />
                      {getRoomSize(room.capacity)}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground">
                      {room.bed_config}
                    </span>
                  </div>

                  <p className="mt-3 font-sans text-[14px] leading-[1.7] text-muted-foreground">
                    {room.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {amenities.map((amenity, idx) => {
                      const Icon = getIcon(amenity)
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 rounded-full bg-primary/[0.06] px-3 py-1.5 font-sans text-[11px] font-medium text-primary"
                        >
                          <Icon size={12} strokeWidth={1.5} />
                          {amenity}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Link
                      href={`/booking/${room.slug}`}
                      className="btn-primary flex-1 text-center"
                      id={`room-book-${room.slug}`}
                    >
                      Book Now →
                    </Link>
                    <Link
                      href={`/booking/${room.slug}`}
                      className="btn-ghost"
                      id={`room-details-${room.slug}`}
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
