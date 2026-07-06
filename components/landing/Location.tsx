import { MapPin, Clock, Plane, Car as CarIcon } from 'lucide-react'
import { queryOne, query } from '@/lib/db'

interface NearbyAttraction {
  name: string
  distance: string
}

export async function Location() {
  const settings = await queryOne<{
    address: string | null
    checkin_time: string
    checkout_time: string
  }>('SELECT address, checkin_time, checkout_time FROM hotel_settings LIMIT 1')

  const nearbyRows = await query<{ name: string; distance: string }>(
    'SELECT name, distance FROM nearby_attraction WHERE active = true ORDER BY sort_order ASC'
  )

  const nearbyAttractions: NearbyAttraction[] = nearbyRows.length > 0 ? nearbyRows.map(r => ({
    name: r.name,
    distance: r.distance,
  })) : [
    { name: 'Bole International Airport', distance: '15 min' },
    { name: 'National Museum', distance: '10 min' },
    { name: 'Unity Park', distance: '12 min' },
  ]

  const settingsContent = settings ?? {
    address: 'Bole, Addis Ababa, Ethiopia',
    checkin_time: '14:00',
    checkout_time: '12:00',
  }

  return (
    <section id="location" className="w-full bg-card px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="section-header gsap-reveal mb-14 flex flex-col items-center text-center">
          <span className="section-heading-eyebrow">
            LOCATION
          </span>
          <h2 className="section-heading-display">
            In the heart of{' '}
            <br className="hidden sm:block" />
            <span className="text-primary">Addis Ababa.</span>
          </h2>
          <p className="mt-4 max-w-[480px] font-sans text-[15px] leading-[1.8] text-muted-foreground">
            Perfectly situated near the city&apos;s top attractions, business districts, and cultural landmarks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-[14px] border border-border shadow-sm">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.5!2d38.7468!3d9.0054!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sAddis+Ababa!5e0!3m2!1sen!2set!4v1600000000000"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Eset Hotel Location Map"
                className="w-full"
                id="location-map"
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="card-base p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-[10px] bg-primary/[0.08]">
                  <MapPin size={18} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground">ADDRESS</span>
                  <span className="mt-1 font-sans text-[14px] font-medium text-foreground">
                    {settingsContent.address}
                  </span>
                </div>
              </div>
            </div>

            <div className="card-base p-6">
              <h3 className="mb-4 font-heading text-[15px] font-semibold text-foreground">Getting Here</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Plane size={16} strokeWidth={1.5} className="text-primary" />
                  <span className="font-sans text-[13px] text-foreground">
                    <strong>Airport:</strong> 15 min from Bole International (ADD)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CarIcon size={16} strokeWidth={1.5} className="text-primary" />
                  <span className="font-sans text-[13px] text-foreground">
                    <strong>Free shuttle:</strong> Complimentary airport transfer
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={16} strokeWidth={1.5} className="text-primary" />
                  <span className="font-sans text-[13px] text-foreground">
                    <strong>Check-in:</strong> {settingsContent.checkin_time} &nbsp;|&nbsp; <strong>Check-out:</strong> {settingsContent.checkout_time}
                  </span>
                </div>
              </div>
            </div>

            {nearbyAttractions.length > 0 && (
              <div className="card-base p-6">
                <h3 className="mb-4 font-heading text-[15px] font-semibold text-foreground">Nearby Attractions</h3>
                <div className="flex flex-col gap-2.5">
                  {nearbyAttractions.map((place, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-sans text-[13px] text-foreground">{place.name}</span>
                      <span className="rounded-full bg-primary/[0.06] px-2.5 py-0.5 font-mono text-[10px] font-medium text-primary">
                        {place.distance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
