'use client'

import { useState, useEffect } from 'react'
import { MapPin, Phone, Mail, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react'

interface Settings {
  address: string
  contactPhone: string
  contactEmail: string
}

export function Contact() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/content/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.address) {
          setSettings({
            address: data.address,
            contactPhone: data.contactPhone || '',
            contactEmail: data.contactEmail || '',
          })
        }
      })
      .catch(() => {})
  }, [])

  const contactPhone = settings?.contactPhone || '+251 123 456 789'
  const contactEmail = settings?.contactEmail || 'info@esethotel.com'
  const contactAddress = settings?.address || 'Bole, Addis Ababa, Ethiopia'

  const validate = (form: HTMLFormElement): boolean => {
    const data = new FormData(form)
    const newErrors: Record<string, string> = {}

    const name = (data.get('name') as string)?.trim()
    const email = (data.get('email') as string)?.trim()
    const message = (data.get('message') as string)?.trim()
    const subject = data.get('subject') as string

    if (!name || name.length < 2) newErrors.name = 'Name must be at least 2 characters'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email'
    if (!subject) newErrors.subject = 'Please select a subject'
    if (!message || message.length < 10) newErrors.message = 'Message must be at least 10 characters'
    if (message && message.length > 2000) newErrors.message = 'Message must be under 2000 characters'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget

    if (!validate(form)) return

    setIsSubmitting(true)

    const formData = new FormData(form)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone') || '',
          subject: formData.get('subject'),
          message: formData.get('message'),
        }),
      })

      if (res.ok) {
        setIsSuccess(true)
      } else {
        const err = await res.json()
        setErrors({ form: err.error || 'Failed to send message' })
      }
    } catch {
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setIsSuccess(false)
    setErrors({})
  }

  return (
    <section id="contact" className="w-full bg-card px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-12">

          {/* Left Column — Info */}
          <div className="lg:col-span-5">
            <div className="section-header gsap-reveal">
              <span className="section-heading-eyebrow inline-block">
                CONTACT US
              </span>
              <h2 className="mt-4 max-w-[380px] section-heading-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-1px' }}>
                We are here to help <span className="text-primary">plan your stay.</span>
              </h2>
            </div>

            <p className="mb-10 mt-4 font-sans text-[15px] leading-[1.8] text-muted-foreground">
              Have questions about reservations, group bookings, events, or special requests? Get in touch with our team, and we will assist you promptly.
            </p>

            <div className="flex flex-col gap-5">
              {/* Item 1 */}
              <div className="flex items-start gap-3">
                <div className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-[10px] bg-primary/[0.08]">
                  <MapPin size={18} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground">ADDRESS</span>
                  <span className="mt-1 font-sans text-[14px] font-medium text-foreground">{contactAddress}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-[10px] bg-primary/[0.08]">
                  <Phone size={18} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground">PHONE</span>
                  <span className="mt-1 font-sans text-[14px] font-medium text-foreground">{contactPhone}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-[10px] bg-primary/[0.08]">
                  <Mail size={18} strokeWidth={1.5} className="text-primary" />
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="font-mono text-[10px] uppercase tracking-[2px] text-muted-foreground">EMAIL</span>
                  <span className="mt-1 font-sans text-[14px] font-medium text-foreground">{contactEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Form */}
          <div className="lg:col-span-7">
            <div className="card-base p-6 sm:p-8">

              {isSuccess ? (
                <div className="flex h-[400px] flex-col items-center justify-center text-center">
                  <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary/[0.08]">
                    <CheckCircle2 size={36} className="text-primary" />
                  </div>
                  <h3 className="font-heading text-[20px] font-semibold text-foreground">
                    Inquiry Sent Successfully!
                  </h3>
                  <p className="mt-2 font-sans text-[14px] text-muted-foreground">
                    Our guest services team will respond to your request within 24 hours.
                  </p>
                  <button
                    onClick={resetForm}
                    className="mt-6 font-sans text-[14px] font-semibold text-primary transition-colors hover:text-primary-dark"
                  >
                    Send another message →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
                  {/* Honeypot field for spam prevention */}
                  <div className="hidden" aria-hidden="true">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </div>

                  {/* Row 1 */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="flex flex-col">
                      <label htmlFor="contact-name" className="mb-1.5 font-sans text-[13px] font-medium text-foreground">Full Name</label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        placeholder="John Doe"
                        className="rounded-[8px] border border-border bg-background px-4 py-3 font-sans text-[15px] text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12"
                      />
                      {errors.name && <p className="mt-1 font-sans text-[12px] text-destructive">{errors.name}</p>}
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="contact-email" className="mb-1.5 font-sans text-[13px] font-medium text-foreground">Email Address</label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        placeholder="john@example.com"
                        className="rounded-[8px] border border-border bg-background px-4 py-3 font-sans text-[15px] text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12"
                      />
                      {errors.email && <p className="mt-1 font-sans text-[12px] text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="flex flex-col">
                      <label htmlFor="contact-phone" className="mb-1.5 font-sans text-[13px] font-medium text-foreground">Phone Number</label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        placeholder="+251 911 ..."
                        className="rounded-[8px] border border-border bg-background px-4 py-3 font-sans text-[15px] text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="contact-subject" className="mb-1.5 font-sans text-[13px] font-medium text-foreground">Subject</label>
                      <div className="relative">
                        <select
                          id="contact-subject"
                          name="subject"
                          required
                          defaultValue=""
                          className="w-full appearance-none rounded-[8px] border border-border bg-background px-4 py-3 font-sans text-[15px] text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12"
                        >
                          <option value="" disabled>Select a subject</option>
                          <option value="reservation">Reservation Inquiry</option>
                          <option value="group">Group Booking & Events</option>
                          <option value="shuttle">Airport Shuttle Request</option>
                          <option value="assistance">Special Assistance Needs</option>
                          <option value="other">Other Inquiry</option>
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      {errors.subject && <p className="mt-1 font-sans text-[12px] text-destructive">{errors.subject}</p>}
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex flex-col">
                    <label htmlFor="contact-message" className="mb-1.5 font-sans text-[13px] font-medium text-foreground">Message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      required
                      maxLength={2000}
                      placeholder="Tell us details about your request or questions..."
                      className="resize-none rounded-[8px] border border-border bg-background px-4 py-3 font-sans text-[15px] text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/12"
                    />
                    {errors.message && <p className="mt-1 font-sans text-[12px] text-destructive">{errors.message}</p>}
                  </div>

                  {errors.form && (
                    <p className="font-sans text-[13px] text-destructive">{errors.form}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary mt-2 w-full py-[14px] disabled:opacity-80"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Sending Inquiry...
                      </>
                    ) : (
                      'Send Inquiry →'
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
