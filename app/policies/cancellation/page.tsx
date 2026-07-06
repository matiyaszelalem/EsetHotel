import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'Understand the cancellation, modifications, and refund policies for bookings at Eset Hotel.',
}

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Small Header */}
      <header className="border-b border-border bg-card px-6 py-6">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-sans text-[14px] font-semibold text-primary transition-colors hover:text-primary-dark"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <span className="font-display text-[18px] font-bold tracking-[-1px] text-foreground">
            Eset<span className="text-primary">Hotel</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[800px] px-6 py-16 sm:py-24">
        {/* Title */}
        <div className="mb-12">
          <span className="font-mono text-[10px] uppercase tracking-[3px] text-primary">POLICIES</span>
          <h1 className="mt-2 font-display text-[38px] font-bold leading-tight tracking-[-2px] text-foreground sm:text-[48px]">
            Cancellation & Refund Policy
          </h1>
          <p className="mt-4 font-sans text-[15px] leading-relaxed text-muted-foreground">
            Last updated: June 15, 2026. Please read these terms carefully before making a reservation. By making a reservation at Eset Hotel, you agree to the conditions listed below.
          </p>
        </div>

        {/* Highlight Grid */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="card-base flex items-start gap-4 p-6 bg-secondary/20 border-primary/20 dark:bg-ink-soft/20">
            <ShieldCheck className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
            <div>
              <h3 className="font-heading text-[15px] font-bold text-foreground">Free Cancellation Window</h3>
              <p className="mt-1.5 font-sans text-[13px] leading-[1.6] text-muted-foreground">
                Cancel up to <strong>48 hours</strong> prior to your arrival date for a 100% full refund on eligible standard rates.
              </p>
            </div>
          </div>

          <div className="card-base flex items-start gap-4 p-6 bg-secondary/20 border-primary/20 dark:bg-ink-soft/20">
            <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
            <div>
              <h3 className="font-heading text-[15px] font-bold text-foreground">Late Cancellation Fees</h3>
              <p className="mt-1.5 font-sans text-[13px] leading-[1.6] text-muted-foreground">
                Cancellations made within 48 hours of check-in, or no-shows, are subject to a fee equal to the <strong>first night&apos;s stay</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="flex flex-col gap-10 font-sans text-[15px] leading-[1.8] text-muted-foreground">
          {/* Section 1 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-[20px] font-bold text-foreground tracking-[-0.5px]">
              1. Standard Reservation Cancellation
            </h2>
            <p>
              Standard reservations are fully refundable if cancelled online or by contacting our reservations desk at least 48 hours prior to your scheduled check-in time (2:00 PM local time). Refund amounts will be credited back to the original credit card or bank account used at checkout.
            </p>
            <p>
              For example, if your check-in date is Friday, June 20, you must submit your cancellation by Wednesday, June 18, before 2:00 PM local hotel time, to avoid any fees.
            </p>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-[20px] font-bold text-foreground tracking-[-0.5px]">
              2. Non-Refundable Rates & Promotions
            </h2>
            <p>
              From time to time, special promotional deals, early bird offers, or package rates are advertised as non-refundable. These rates are strictly non-refundable and non-changeable once confirmed. In the event of a cancellation or no-show, the full amount of the stay will be charged.
            </p>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-[20px] font-bold text-foreground tracking-[-0.5px]">
              3. Booking Modifications
            </h2>
            <p>
              You may request modifications to your stay (such as changing check-in/out dates or upgrading room types) up to 48 hours before arrival, subject to room availability and seasonal price changes. Any rate differences must be paid upon confirmation. Modifications requested within 48 hours of arrival will be handled at the sole discretion of hotel management.
            </p>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-[20px] font-bold text-foreground tracking-[-0.5px]">
              4. No-Show Policy
            </h2>
            <p>
              If you fail to arrive at the hotel on your scheduled check-in date without prior notification, your reservation will be marked as a &quot;No-Show&quot; and the room will be released back into inventory at 12:00 PM (noon) the following day. For standard bookings, you will be billed for the first night of the stay. For prepaid or promotional bookings, the entire booking cost is forfeited.
            </p>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-[20px] font-bold text-foreground tracking-[-0.5px]">
              5. Refund Timeline & Processing
            </h2>
            <p>
              Approved refunds for online payments are processed instantly by our system. However, depending on your financial institution, the refund may take 5 to 10 business days to appear on your bank statement. Eset Hotel does not charge processing fees for refunds.
            </p>
          </section>
        </div>

        {/* Help box */}
        <div className="mt-16 rounded-[12px] border border-border bg-card p-6 text-center sm:p-8">
          <h3 className="font-heading text-[16px] font-bold text-foreground">Need to make a change to your reservation?</h3>
          <p className="mt-2 font-sans text-[14px] text-muted-foreground">
            Our support and reception teams are available 24/7. Have your reference ID ready.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/#contact"
              className="btn-primary py-2.5 px-5"
            >
              Contact Support
            </Link>
            <Link
              href="/"
              className="btn-ghost py-2.5 px-5"
            >
              Back to Booking
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
