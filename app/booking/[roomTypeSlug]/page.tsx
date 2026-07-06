import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getEtbRate, formatDualPrice, formatDualPriceCompact } from '@/lib/dual-pricing'
import { queryOne } from '@/lib/db'

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

export default async function RoomDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomTypeSlug: string }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>
}) {
  const { roomTypeSlug } = await params
  const sp = await searchParams
  const checkIn = sp.checkIn || new Date().toISOString().split('T')[0]
  const checkOut = sp.checkOut || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  const guests = sp.guests || '2'

  const roomType = await queryOne<{
    id: string
    slug: string
    name: string
    description: string | null
    base_price: number
    capacity: number
    bed_config: string | null
    amenities: string
    images: string
  }>('SELECT * FROM room_type WHERE slug = $1', [roomTypeSlug])

  if (!roomType) {
    notFound()
  }

  const etbRate = await getEtbRate()

  const amenities: string[] = JSON.parse(roomType.amenities || '[]')

  const date1 = new Date(checkIn)
  const date2 = new Date(checkOut)
  const nights = Math.max(1, Math.round((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24)))
  const subtotal = roomType.base_price * nights
  const taxes = subtotal * 0.15
  const total = subtotal + taxes

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="mx-auto max-w-[1200px] px-6">

        <Link href={`/booking?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Search Results
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          <div className="lg:col-span-8">
            <div className="rounded-[16px] overflow-hidden border border-border bg-card mb-10">
              <div className="aspect-video relative bg-muted">
                <img src={roomImage(roomType.slug)} alt={roomType.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>

            <h1 className="font-heading text-4xl font-semibold text-foreground mb-4">{roomType.name}</h1>
            <p className="text-muted-foreground font-sans text-base leading-relaxed mb-10 max-w-[600px]">
              {roomType.description}
            </p>

            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Room Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {amenities.map(amenity => (
                <div key={amenity} className="flex items-center gap-3 text-sm font-sans text-foreground">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Check size={12} className="text-primary" />
                  </div>
                  {amenity}
                </div>
              ))}
            </div>

            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Policies</h2>
            <div className="rounded-[12px] bg-muted/50 p-6 border border-border">
              <ul className="space-y-3 text-sm font-sans text-muted-foreground list-disc list-inside">
                <li>Check-in time is from 2:00 PM.</li>
                <li>Check-out time is until 11:00 AM.</li>
                <li>Free cancellation up to 48 hours before check-in.</li>
                <li>Pets are not allowed in this room type.</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-[16px] border border-border bg-card p-6 shadow-sm">
              <h3 className="font-heading text-xl font-semibold text-foreground mb-6">Your Stay</h3>

              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">Check In</div>
                  <div className="text-sm font-semibold text-foreground">{checkIn}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">Check Out</div>
                  <div className="text-sm font-semibold text-foreground">{checkOut}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">Guests</div>
                  <div className="text-sm font-semibold text-foreground">{guests}</div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-6 mb-6">
                <h4 className="font-sans text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Price Breakdown</h4>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">${roomType.base_price} x {nights} nights <span className="text-[10px]">({formatDualPrice(roomType.base_price, etbRate).etbShort}/night)</span></div>
                  <div className="text-sm font-medium text-foreground">${subtotal}</div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">Taxes & Fees (15%)</div>
                  <div className="text-sm font-medium text-foreground">${taxes.toFixed(2)}</div>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="text-base font-semibold text-foreground">Total</div>
                  <div className="text-xl font-display font-bold text-primary">${total.toFixed(2)}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    ≈ {formatDualPriceCompact(total, etbRate)}
                  </div>
                </div>
              </div>

              <Link
                href={`/booking/checkout?room=${roomTypeSlug}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                className="flex w-full items-center justify-center rounded-[8px] bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 gap-2 group"
              >
                Proceed to Checkout
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-4">
                You won&apos;t be charged yet
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
