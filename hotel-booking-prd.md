# Product Requirements Document (PRD)
## Hotel Landing Page & Booking Management System

**Version:** 1.0
**Date:** June 15, 2026
**Target Stack:** Next.js 16, PostgreSQL, NextAuth, Stripe, Telegram Bot API
**Deployment:** Vercel (free tier) / Self-hosted

---

## 1. Executive Summary

A single-property hotel website combining a public-facing marketing landing page with an integrated booking management system. The system allows guests to browse rooms, check availability, and book directly (online payment or pay-at-hotel), while giving hotel staff and admins tools to manage bookings, rooms, pricing, policies, and guest communication — all built at zero infrastructure cost using free-tier services.

---

## 2. Goals & Objectives

- Provide guests a seamless, mobile-friendly booking experience
- Eliminate reliance on third-party booking platforms for direct bookings (reduce OTA commission dependency)
- Give hotel staff real-time visibility into occupancy, bookings, and guest needs
- Automate confirmations, reminders, and cancellation/refund logic
- Maintain a $0 operating cost at launch, with a clear path to scale
- Build on Next.js 16 with an architecture that supports future AI features (chatbot, dynamic pricing, smart recommendations) and multi-property expansion

---

## 3. User Roles & Permissions

| Role | Access |
|---|---|
| **Guest** | Public site, booking flow, "My Bookings" (login or email lookup), profile (if logged in) |
| **Front-desk Staff** | Staff dashboard: check-in/out, room status, walk-in bookings, guest search, today's arrivals/departures |
| **Hotel Admin** | Full dashboard: rooms, pricing, promotions, policies, staff accounts, reports, content management |
| **Super-admin** | All admin access + system settings (integrations, payment keys, backups) |

Role-based access enforced via NextAuth session + middleware route protection.

---

## 4. Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Framework | Next.js 16 (App Router, Server Actions) | Free |
| Database | PostgreSQL (Neon or Supabase free tier) | Free tier |
| ORM | Drizzle or Prisma | Free |
| Auth | NextAuth.js (Auth.js v5) — Credentials + Google OAuth | Free |
| Payments | Stripe (Checkout, test → live mode) | Free until live tx (then standard fees) |
| Email | Resend SDK (Resend free tier) | Free tier |
| Admin/Staff Notifications | Telegram Bot API | Free |
| Image/File Storage | Cloudinary free tier or Vercel Blob | Free tier |
| Hosting | Vercel Hobby plan | Free |
| Maps | Google Maps Embed | Free |
| OTA Sync | iCal export/import | Free |

---

## 5. Functional Requirements & Use Cases

### 5.1 Public Landing Page

| ID | Use Case | Priority |
|---|---|---|
| LP-01 | View hotel overview/hero section with key info | Must |
| LP-02 | Browse room types with images, descriptions, pricing | Must |
| LP-03 | View amenities list (pool, gym, restaurant, Wi-Fi, parking, etc.) | Must |
| LP-04 | View photo gallery | Must |
| LP-05 | View location map (Google Maps embed) | Must |
| LP-06 | View guest testimonials/reviews | Should |
| LP-07 | View special offers/promotions banner | Should |
| LP-08 | Submit contact/inquiry form | Must |
| LP-09 | View cancellation & refund policy page | Must |
| LP-10 | View FAQ section | Should |
| LP-11 | SEO optimization (meta tags, sitemap, robots.txt, OpenGraph) | Must |
| LP-12 | Mobile responsive design | Must |
| LP-13 | Basic accessibility (WCAG AA where feasible) | Should |

---

### 5.2 Booking Flow (Guest-Facing)

| ID | Use Case | Priority |
|---|---|---|
| BK-01 | Search room availability by check-in/check-out dates + guest count | Must |
| BK-02 | View real-time availability per room type | Must |
| BK-03 | View dynamic/seasonal pricing applied to selected dates | Must |
| BK-04 | View room details (size, bed config, max occupancy, amenities, photos) | Must |
| BK-05 | Add multiple rooms/room types to one booking | Should |
| BK-06 | View itemized price breakdown (rate, nights, taxes, fees, discounts) | Must |
| BK-07 | Apply promo code | Should |
| BK-08 | Choose payment method: Pay Online (Stripe) or Pay at Hotel | Must |
| BK-09 | Complete Stripe Checkout for online payment | Must |
| BK-10 | Enter guest details (name, email, phone, special requests) | Must |
| BK-11 | Receive booking confirmation (on-screen + email) with reference ID | Must |
| BK-12 | Guest checkout without account creation | Must |
| BK-13 | Optional account creation/login during or after booking | Should |
| BK-14 | View booking via login ("My Bookings") | Should |
| BK-15 | View booking via email + reference ID lookup (no login) | Must |
| BK-16 | Cancel own booking (subject to policy) | Must |
| BK-17 | Request booking modification (dates/room — subject to availability, handled by staff) | Should |
| BK-18 | Download invoice/receipt as PDF | Could |
| BK-19 | Repeat/re-book shortcut for returning logged-in guests | Could |

---

### 5.3 Cancellation & Refund Logic

| ID | Use Case | Priority |
|---|---|---|
| CR-01 | Admin configures cancellation policy (free-cancel window, partial refund tiers, no-refund window) | Must |
| CR-02 | Guest views policy before confirming booking | Must |
| CR-03 | System calculates refund amount based on cancellation date vs check-in date | Must |
| CR-04 | Online-paid cancellation triggers Stripe refund (auto if within threshold; else admin-approval queue) | Must |
| CR-05 | Pay-at-hotel cancellation updates status only (no financial transaction) | Must |
| CR-06 | Admin can manually override refund decisions | Should |
| CR-07 | No-show handling: staff marks booking as no-show, logged for records | Should |
| CR-08 | Audit log of cancellations/refunds | Should |

---

### 5.4 Front-Desk Staff Dashboard

| ID | Use Case | Priority |
|---|---|---|
| FD-01 | View today's arrivals and departures list | Must |
| FD-02 | Check in guest (update booking status, record actual arrival) | Must |
| FD-03 | Check out guest (finalize bill, update status) | Must |
| FD-04 | View room status board (Available/Occupied/Reserved/Maintenance/Dirty/Clean) | Must |
| FD-05 | Update individual room status (housekeeping) | Must |
| FD-06 | Create walk-in (manual) booking | Must |
| FD-07 | Collect/confirm pay-at-hotel payment at check-in | Must |
| FD-08 | Add extra charges to a booking (minibar, services, late checkout) | Should |
| FD-09 | Search bookings by guest name/reference/date | Must |
| FD-10 | View guest special requests/notes | Must |
| FD-11 | Generate/print invoice | Could |

---

### 5.5 Hotel Admin Dashboard

**Room & Inventory Management**

| ID | Use Case | Priority |
|---|---|---|
| AD-01 | Add/edit/delete room types (name, description, photos, capacity, amenities) | Must |
| AD-02 | Set base price per room type | Must |
| AD-03 | Configure seasonal/date-range pricing overrides | Must |
| AD-04 | Set total inventory count per room type | Must |
| AD-05 | Block rooms for maintenance | Should |
| AD-06 | Set minimum stay requirements per date range | Should |

**Booking Management**

| ID | Use Case | Priority |
|---|---|---|
| AD-07 | View all bookings with filters (status, dates, source) | Must |
| AD-08 | Manually create/edit/cancel bookings | Must |
| AD-09 | Visual booking/occupancy calendar | Should |
| AD-10 | Overbooking conflict alerts | Must |

**Pricing & Promotions**

| ID | Use Case | Priority |
|---|---|---|
| AD-11 | Create/manage promo codes (type, value, validity, usage limits) | Should |
| AD-12 | Configure tax rates and service charges | Must |

**Policy & Settings**

| ID | Use Case | Priority |
|---|---|---|
| AD-13 | Configure cancellation/refund policy tiers | Must |
| AD-14 | Configure check-in/check-out times | Must |
| AD-15 | Manage general hotel info (name, address, contact, currency) | Must |
| AD-16 | Configure Stripe API keys | Must |
| AD-17 | Configure Telegram bot integration | Must |

**Staff Management**

| ID | Use Case | Priority |
|---|---|---|
| AD-18 | Add/remove staff accounts | Must |
| AD-19 | Assign roles/permissions | Must |

**Guest Communication**

| ID | Use Case | Priority |
|---|---|---|
| AD-20 | View/respond to contact form messages | Should |
| AD-21 | Send manual email to guest | Could |
| AD-22 | Automated emails: confirmation, pre-arrival reminder, cancellation, post-stay thank-you | Must |

**Reports & Analytics**

| ID | Use Case | Priority |
|---|---|---|
| AD-23 | Occupancy rate report (daily/weekly/monthly) | Should |
| AD-24 | Revenue report by date range/room type | Should |
| AD-25 | Booking source breakdown (direct vs OTA) | Could |
| AD-26 | Cancellation rate report | Could |
| AD-27 | ADR / RevPAR metrics | Could |
| AD-28 | Export reports as CSV | Could |

**Content Management**

| ID | Use Case | Priority |
|---|---|---|
| AD-29 | Edit landing page content (hero, amenities, gallery) | Should |
| AD-30 | Manage testimonials (add/approve/hide) | Should |
| AD-31 | Manage promotions display on landing page | Should |

**OTA Integration**

| ID | Use Case | Priority |
|---|---|---|
| AD-32 | iCal export of availability for OTA platforms | Should |
| AD-33 | iCal import to block dates booked via OTA | Should |

---

### 5.6 Authentication & Accounts

| ID | Use Case | Priority |
|---|---|---|
| AU-01 | Guest registration/login (email/password) | Should |
| AU-02 | Google OAuth login | Could |
| AU-03 | Password reset flow | Should |
| AU-04 | Staff/admin login (no public registration) | Must |
| AU-05 | Role-based route protection | Must |
| AU-06 | Guest profile management (contact info, booking history) | Could |

---

### 5.7 Notifications

| ID | Use Case | Priority |
|---|---|---|
| NT-01 | Email: booking confirmation | Must |
| NT-02 | Email: pre-arrival reminder | Should |
| NT-03 | Email: cancellation confirmation | Must |
| NT-04 | Email: post-stay thank-you/review request | Could |
| NT-05 | Telegram: new booking alert to admin/staff | Must |
| NT-06 | Telegram: cancellation alert | Should |
| NT-07 | Telegram: new contact inquiry alert | Should |
| NT-08 | Telegram: low-availability alert | Could |

---

### 5.8 Edge Cases & System Logic

| ID | Case | Handling |
|---|---|---|
| EC-01 | Concurrent booking on same room/date | DB transaction/row locking to prevent double-booking |
| EC-02 | Unpaid "Pay Online" booking abandoned | Auto-cancel/release hold after timeout (e.g., 15 min) |
| EC-03 | Booking past dates | Frontend + backend validation |
| EC-04 | Admin deletes room type with active bookings | Block deletion, show warning |
| EC-05 | Overlapping seasonal pricing rules | Validation warning on save |
| EC-06 | Failed Stripe payment | Show error, allow retry, booking remains "pending" |
| EC-07 | Time zone handling | Store all times in UTC, display in hotel's local time zone |
| EC-08 | Currency | Single currency (configurable in settings), multi-currency-ready schema |

---

## 6. Data Model (High-Level)

```
users
  id, name, email, password_hash, role (guest|staff|admin|super_admin),
  phone, created_at, updated_at

room_types
  id, name, slug, description, base_price, capacity,
  total_inventory, amenities[], images[], created_at

rooms
  id, room_type_id, room_number, status (available|occupied|reserved|maintenance|dirty|clean)

bookings
  id, user_id (nullable), guest_name, guest_email, guest_phone,
  check_in, check_out, status (pending|confirmed|checked_in|checked_out|cancelled|no_show),
  payment_method (online|pay_at_hotel),
  payment_status (pending|paid|refunded|partially_refunded|failed),
  total_price, currency, special_requests, source (direct|ota), reference_id,
  created_at, updated_at

booking_rooms
  id, booking_id, room_type_id, quantity, price_per_night

payments
  id, booking_id, amount, method, stripe_payment_id,
  status (succeeded|failed|refunded|partial_refund), refund_amount, created_at

pricing_rules
  id, room_type_id, start_date, end_date, price_override, min_stay

promo_codes
  id, code, discount_type (percentage|fixed), value,
  valid_from, valid_to, usage_limit, used_count, active

cancellation_policy
  id, days_before_checkin, refund_percentage

testimonials
  id, guest_name, rating, comment, approved, created_at

contact_messages
  id, name, email, message, status (new|responded), created_at

audit_logs
  id, user_id, action, entity, entity_id, details, created_at

hotel_settings
  id, hotel_name, address, contact_email, contact_phone, currency,
  checkin_time, checkout_time, tax_rate, telegram_bot_token, telegram_chat_id
```

---

## 7. Key User Flows

### 7.1 Booking Flow
1. Guest searches dates + guest count → sees available room types with pricing
2. Selects room(s) → reviews itemized total (base rate + seasonal adjustments + taxes − promo)
3. Enters guest details
4. Chooses payment method:
   - **Online** → Stripe Checkout → success → `payment_status: paid`, `status: confirmed`
   - **Pay at Hotel** → `payment_status: pending`, `status: confirmed` (reserved)
5. System sends confirmation email + Telegram alert to admin
6. Guest receives reference ID for future lookup

### 7.2 Cancellation Flow
1. Guest looks up booking (login or email + reference ID)
2. Initiates cancellation → system shows policy-based refund amount
3. Confirms cancellation
4. If online-paid: Stripe refund processed (auto or admin-approved per threshold)
5. If pay-at-hotel: status updated, no transaction
6. Email confirmation sent to guest; Telegram alert sent to admin

### 7.3 Check-in/Check-out Flow (Staff)
1. Staff views today's arrivals
2. Confirms guest identity, collects payment if "pay at hotel"
3. Marks booking as "checked-in", assigns/updates room status to "occupied"
4. On departure: staff finalizes any extra charges, marks "checked-out", room status → "dirty" → "clean" after housekeeping

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Page load < 2s on landing page (Next.js ISR/SSG for static content) |
| Availability | 99% uptime (Vercel free tier dependent) |
| Security | Passwords hashed (bcrypt via NextAuth), HTTPS enforced, Stripe handles all card data (PCI-DSS out of scope) |
| Privacy | GDPR-aware: privacy policy, cookie consent, data export/delete on request |
| Scalability | Schema designed to support multi-property and multi-currency in future without major rework |
| Maintainability | Modular component structure, typed (TypeScript), documented API routes |

---

## 9. Roadmap / Phases

### Phase 1 — MVP
- Landing page (LP-01 to LP-05, LP-08, LP-09, LP-11, LP-12)
- Booking flow (BK-01 to BK-12, BK-15)
- Cancellation/refund core (CR-01 to CR-05)
- Admin: room/inventory management, basic booking management (AD-01 to AD-04, AD-07, AD-08, AD-13 to AD-17)
- Auth: staff/admin login (AU-04, AU-05)
- Email confirmations (NT-01, NT-03)
- Telegram new booking alert (NT-05)

### Phase 2 — Operations
- Front-desk dashboard (FD-01 to FD-10)
- Promo codes (AD-11, BK-07)
- Guest accounts + My Bookings (AU-01 to AU-03, AU-06, BK-13, BK-14)
- Remaining notifications (NT-02, NT-04, NT-06, NT-07)
- Reports basics (AD-23, AD-24)
- Overbooking alerts (AD-10)
- Booking calendar (AD-09)

### Phase 3 — Growth
- Testimonials system (LP-06, AD-30)
- Special offers (LP-07, AD-31)
- Content management (AD-29)
- iCal OTA sync (AD-32, AD-33)
- Advanced reports (AD-25 to AD-28)
- PDF invoices (BK-18, FD-11)
- Modification requests (BK-17)
- No-show handling (CR-07), audit logs (CR-08)

### Phase 4 — Future
- AI chatbot concierge
- AI-based dynamic pricing recommendations
- AI search/recommendation engine
- Multi-language support
- WhatsApp notifications
- Multi-property support
- Full OTA Channel Manager API integration

---

## 10. Open Risks & Assumptions

| Risk/Assumption | Mitigation |
|---|---|
| Free-tier DB/hosting limits exceeded with growth | Monitor usage; migrate to paid tier or self-host VPS |
| Stripe live mode requires business verification | Use test mode during dev; complete verification before launch |
| iCal sync has 24-48hr OTA update delays (no real-time) | Acceptable for MVP; document limitation; full Channel Manager API in Phase 4 |
| Telegram Bot API rate limits | Sufficient for single-property low volume |
| Local payment gateway not yet selected | Stripe covers Phase 1; add local gateway as additional option later |

---

*End of PRD v1.0*
