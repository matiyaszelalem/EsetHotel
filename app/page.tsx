import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { TrustBar } from '@/components/landing/TrustBar'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'
import { Testimonials } from '@/components/landing/Testimonials'
import { Contact } from '@/components/landing/Contact'
import { Footer } from '@/components/landing/Footer'
import { ScrollAnimations } from '@/components/landing/ScrollAnimations'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Features />
        <Pricing />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <ScrollAnimations />
    </>
  )
}
