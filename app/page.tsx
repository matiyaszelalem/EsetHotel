import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { BookingBar } from '@/components/landing/BookingBar'
import { Rooms } from '@/components/landing/Rooms'
import { Amenities } from '@/components/landing/Amenities'
import { Gallery } from '@/components/landing/Gallery'
import { SpecialOffers } from '@/components/landing/SpecialOffers'
import { Testimonials } from '@/components/landing/Testimonials'
import { Location } from '@/components/landing/Location'
import { FAQ } from '@/components/landing/FAQ'
import { Contact } from '@/components/landing/Contact'
import { Footer } from '@/components/landing/Footer'
import { ScrollAnimations } from '@/components/landing/ScrollAnimations'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <BookingBar />
        <Rooms />
        <Amenities />
        <Gallery />
        <SpecialOffers />
        <Testimonials />
        <Location />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <ScrollAnimations />
    </>
  )
}
