import Link from 'next/link'
import { Calendar, Users, ArrowRight } from 'lucide-react'
import { getEtbRate, formatDualPrice } from '@/lib/dual-pricing'
import { query } from '@/lib/db'

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

export default async function BookingSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>
}) {
  const params = await searchParams
  const checkIn = params.checkIn || new Date().toISOString().split('T')[0]
  const checkOut = params.checkOut || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  const guests = parseInt(params.guests || '2', 10)
  const etbRate = await getEtbRate()

  const roomTypes = await query<{
    id: string; slug: string; name: string; description: string | null
    base_price: number; capacity: number; amenities: string
  }>('SELECT id, slug, name, description, base_price, capacity, amenities FROM room_type ORDER BY base_price ASC')

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  const bookedRoomIdsResult = await query<{ room_id: string }>(
    `SELECT DISTINCT br.room_id FROM booking_room br
     JOIN booking b ON b.id = br.booking_id
     WHERE b.status NOT IN ('CANCELLED', 'NO_SHOW')
     AND b.check_in < $2
     AND b.check_out > $1`,
    [checkInDate.toISOString(), checkOutDate.toISOString()]
  )
  const bookedRoomIds = new Set(bookedRoomIdsResult.map(r => r.room_id))

  const allRooms = await query<{ id: string; room_type_id: string; status: string }>(
    'SELECT id, room_type_id, status FROM room'
  )

  const roomsByType = new Map<string, typeof allRooms>()
  for (const room of allRooms) {
    const arr = roomsByType.get(room.room_type_id) || []
    arr.push(room)
    roomsByType.set(room.room_type_id, arr)
  }

  const roomTypesWithAvailability = roomTypes.map((type) => {
    const physicalRooms = roomsByType.get(type.id) || []
    const totalRooms = physicalRooms.length
    const availableRooms = physicalRooms.filter(
      r => r.status !== 'MAINTENANCE' && !bookedRoomIds.has(r.id)
    ).length
    const amenities: string[] = JSON.parse(type.amenities || '[]')

    return {
      id: type.id,
      name: type.name,
      slug: type.slug,
      description: type.description,
      basePrice: type.base_price,
      capacity: type.capacity,
      amenities,
      totalRooms,
      availableRooms,
    }
  })

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="mx-auto max-w-[1200px] px-6">

        <div className="mb-12 rounded-[16px] bg-card border border-border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">Available Rooms</h1>
              <p className="text-muted-foreground text-sm font-sans flex items-center gap-4">
                <span className="flex items-center gap-2"><Calendar size={16}/> {checkIn} to {checkOut}</span>
                <span className="flex items-center gap-2"><Users size={16}/> {guests} Guests</span>
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[8px] border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Modify Search
            </Link>
          </div>
        </div>

        <div className="grid gap-8">
          {roomTypesWithAvailability.map(room => (
            <div key={room.id} className="flex flex-col md:flex-row overflow-hidden rounded-[16px] border border-border bg-card shadow-sm transition-all hover:border-primary/50">

              <div className="w-full md:w-2/5 lg:w-1/3 aspect-[4/3] md:aspect-auto relative bg-muted">
                <img src={roomImage(room.slug)} alt={room.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>

              <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-heading text-2xl font-semibold text-foreground">{room.name}</h2>
                      <p className="text-muted-foreground mt-2 font-sans text-sm leading-relaxed max-w-[500px]">
                        {room.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-3xl font-display font-bold text-foreground">${room.basePrice}</div>
                      <div className="text-[11px] font-mono tracking-wider text-muted-foreground mt-1">Per Night</div>
                      <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                        ≈ {formatDualPrice(room.basePrice, etbRate).etbShort}/night
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {room.amenities.map(amenity => (
                      <span key={amenity} className="inline-flex items-center rounded-full bg-primary/[0.08] px-3 py-1 text-xs font-medium text-primary">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3">
                    {room.availableRooms > 0 ? (
                      <span className="text-xs text-success font-medium">
                        {room.availableRooms} of {room.totalRooms} rooms available
                      </span>
                    ) : (
                      <span className="text-xs text-destructive font-medium">Sold out</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 border-t border-border/50 pt-6">
                  <div className="text-sm font-medium text-muted-foreground">
                    Up to {room.capacity} guests
                  </div>
                  {room.availableRooms > 0 ? (
                    <Link
                      href={`/booking/${room.slug}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                      className="inline-flex items-center justify-center rounded-[8px] bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 gap-2 group"
                    >
                      Select Room
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-[8px] bg-muted px-6 py-3 text-sm font-medium text-muted-foreground cursor-not-allowed">
                      Unavailable
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}

          {roomTypesWithAvailability.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No rooms available for your selected dates and guests.</p>
              <Link href="/" className="text-primary font-medium mt-4 inline-block hover:underline">Modify your search</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
