# Phase 1B — Booking Flow & Backend Foundation

Phase 1A successfully delivered the marketing frontend for Eset Hotel. Now in **Phase 1B**, we will build the core backend infrastructure and the guest-facing booking flow.

## Goal Description
Implement the database, API routes, and the multi-step booking user interface, allowing guests to search for available dates, select a room, and securely complete a booking. We will use a local SQLite database for development ease (easily swappable to PostgreSQL for production) and integrate Stripe for payments.

---

## Proposed Changes

### 1. Database Foundation (Prisma ORM)
We will install Prisma and configure a local SQLite database for fast development.

#### [NEW] `prisma/schema.prisma`
Core models required for the booking engine:
- `RoomType`: Information about the room (slug, name, description, capacity, basePrice, amenities).
- `Room`: Individual physical rooms linked to a `RoomType`.
- `Booking`: Guest details, dates, total price, status (PENDING, CONFIRMED, CANCELLED), and payment method.
- `Payment`: Tracks Stripe transactions related to a booking.

### 2. Core API Routes
Next.js API routes to handle the booking logic.

#### [NEW] `app/api/availability/route.ts`
- Accepts `checkIn`, `checkOut`, and `guests` parameters.
- Queries the database for available `RoomType`s by checking existing overlapping `Booking`s.
- Returns availability and pricing.

#### [NEW] `app/api/bookings/route.ts`
- Handles the creation of a new booking record (status: PENDING).
- Calculates the final price based on the `RoomType` base price and number of nights.

### 3. Stripe Integration
Secure payment processing.

#### [NEW] `app/api/stripe/checkout/route.ts`
- Creates a Stripe Checkout Session for the selected room and dates.
- Redirects the user to Stripe's hosted checkout page.

#### [NEW] `app/api/stripe/webhook/route.ts`
- Listens for `checkout.session.completed` events from Stripe.
- Updates the corresponding `Booking` status to CONFIRMED.

### 4. Booking UI Flow (Frontend)
A seamless, multi-step booking experience routing through `/app/booking/*`.

#### [NEW] `app/booking/page.tsx` (Availability Search Results)
- The page users land on after clicking "Check Availability" from the landing page.
- Displays available rooms for the selected dates.
- Shows dynamic pricing total.

#### [NEW] `app/booking/[roomTypeSlug]/page.tsx` (Room Details & Booking)
- Detailed view of the selected room type.
- Shows amenities, policies, and a price breakdown.
- Contains the "Proceed to Checkout" button.

#### [NEW] `app/booking/checkout/page.tsx` (Guest Details)
- A form to collect guest information (Name, Email, Phone, Special Requests).
- Payment method selection (Pay Online via Stripe or Pay at Hotel).

#### [NEW] `app/booking/confirmation/[referenceId]/page.tsx` (Success Page)
- The final page shown after a successful booking.
- Displays the booking reference ID and a summary of the stay.

---

## User Review Required

> [!IMPORTANT]
> **Database Selection:** I plan to use **SQLite** with Prisma for this development phase. It requires zero setup on your end and works instantly. When you deploy to production (e.g., Vercel), you can simply change the provider to `postgresql` and provide a Neon or Supabase connection string. Does this approach sound good?

> [!IMPORTANT]
> **Stripe Keys:** We will need Stripe API keys (Test Mode) to implement the payment flow. I can set up the code using placeholder keys, or you can provide your test keys in a `.env.local` file. Let me know your preference.

> [!WARNING]
> **Mock Data:** To test the booking flow, I will write a small database seeding script (`prisma/seed.ts`) that automatically populates the database with the 4 room types (Standard, Deluxe, Junior Suite, Presidential) and some dummy physical rooms.

---

## Open Questions

1. **Pay at Hotel:** Do you want to allow guests to bypass Stripe entirely if they select "Pay at Hotel", or should we still capture a credit card on file for no-show guarantees? For MVP, bypassing it entirely is simplest.
2. **Email Notifications:** Should we integrate a service like Resend for email confirmations now, or mock the email sending function in the console for this phase?

---

## Verification Plan

### Automated/Code Verification
- Run `npx prisma db push` and `npx prisma db seed` to ensure the schema is valid and data populates correctly.
- Ensure all new API routes compile and return expected JSON structures.

### Manual Verification
- Start on the landing page, enter dates, and click "Check Availability".
- Verify routing to `/booking` and that available rooms are displayed.
- Proceed through the checkout form with guest details.
- Verify that a `Booking` record is created in the local SQLite database using Prisma Studio.
