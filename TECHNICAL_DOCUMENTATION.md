# Eset Hotel — Technical Documentation

> **Version:** 1.0.0  
> **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Neon)  
> **Status:** Phase 1B Development  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Booking Flow](#8-booking-flow)
9. [Payment System](#9-payment-system)
10. [OTA Channel Manager](#10-ota-channel-manager)
11. [Frontend Component Architecture](#11-frontend-component-architecture)
12. [Design System](#12-design-system)
13. [Notifications & Email](#13-notifications--email)
14. [SEO & Metadata](#14-seo--metadata)
15. [Environment Configuration](#15-environment-configuration)
16. [Development & Deployment](#16-development--deployment)

---

## 1. System Overview

Eset Hotel is a full-featured **hotel booking and property management platform** for a single-property establishment. It serves three distinct user roles:

| Role | Access | Capabilities |
|---|---|---|
| **Guest** | Public + Account | Browse rooms, book, manage reservations, view history |
| **Staff / Admin** | Dashboard | Front desk operations, room management, booking CRUD, content management, reports |
| **Super Admin** | Dashboard + Admin | User management, audit logs, all admin capabilities |

The application is deployed as a **Next.js server-rendered application** with a PostgreSQL backend hosted on Neon.tech. It uses a custom JWT-based authentication system, Stripe for payment processing, and a built-in OTA channel manager for integration with online travel agencies.

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Next.js 16 Server                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │                  App Router                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │  │
│  │  │  Public   │  │ Account  │  │   Dashboard      │ │  │
│  │  │  Routes   │  │ Routes   │  │   Routes         │ │  │
│  │  └────┬─────┘  └────┬─────┘  └───────┬──────────┘ │  │
│  │       │              │                │             │  │
│  │  ┌────┴──────────────┴────────────────┴──────────┐ │  │
│  │  │              API Routes                        │ │  │
│  │  │  /api/auth  /api/bookings  /api/stripe        │ │  │
│  │  │  /api/dashboard/*  /api/content/*  /api/ical  │ │  │
│  │  └─────────────────────┬─────────────────────────┘ │  │
│  │                        │                            │  │
│  │  ┌─────────────────────┴─────────────────────────┐ │  │
│  │  │           Library Layer (lib/)                 │ │  │
│  │  │  db.ts  auth.ts  email.ts  pdf.ts             │ │  │
│  │  │  notifications.ts  dual-pricing.ts            │ │  │
│  │  │  channel-manager/  hooks/                     │ │  │
│  │  └─────────────────────┬─────────────────────────┘ │  │
│  └────────────────────────┼───────────────────────────┘  │
│                           │                               │
└───────────────────────────┼───────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
     ┌────────▼────────┐          ┌────────▼────────┐
     │   PostgreSQL     │          │   Stripe API    │
     │   (Neon.tech)    │          │   (Payments)    │
     └─────────────────┘          └─────────────────┘
```

### 2.2 Routing Architecture

The application uses Next.js App Router with **Route Groups** for logical separation:

```
app/
├── (auth)/         # Authentication flows (login, register, password reset)
├── (account)/      # Guest account pages (profile, bookings)
├── (dashboard)/    # Staff/admin dashboard (protected by role check)
├── api/            # All API routes (auth, bookings, stripe, dashboard, content)
├── booking/        # Public booking flow
├── policies/       # Static policy pages
└── page.tsx        # Landing page
```

### 2.3 Server vs Client Component Strategy

| Type | When to Use | Examples |
|---|---|---|
| **Server Components** | Data fetching, SEO content, static pages | `Rooms.tsx`, `Amenities.tsx`, `Testimonials.tsx` |
| **Client Components** | Interactivity, forms, animations, browser APIs | `Navbar.tsx`, `Hero.tsx`, `Contact.tsx`, `ScrollAnimations.tsx` |

---

## 3. Technology Stack

### 3.1 Core Framework

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.9 | React framework with App Router |
| React | 19.2.7 | UI library |
| TypeScript | ~5.x | Type safety |
| Tailwind CSS | 3.4 | Utility-first styling |

### 3.2 Dependencies

**UI & Styling:**
- `tailwindcss-animate` — animation utilities
- `tailwind-merge` + `clsx` + `class-variance-authority` — class management
- `lucide-react` — icon library
- `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-slot` — accessible primitives
- `next-view-transitions` — page transition animations
- `gsap` + `ScrollTrigger` — advanced animations

**Forms & Validation:**
- `react-hook-form` — form state management
- `@hookform/resolvers` + `zod` — schema validation

**Database:**
- `pg` + `@types/pg` — PostgreSQL client (raw SQL, no ORM)

**Authentication:**
- `bcryptjs` — password hashing
- `jsonwebtoken` + `@types/jsonwebtoken` — JWT generation and verification

**Payments:**
- `stripe` — server-side Stripe SDK
- `@stripe/stripe-js` — client-side Stripe.js

**Email:**
- `resend` — Resend SDK transactional email delivery

**PDF:**
- `jspdf` + `jspdf-autotable` — PDF invoice generation

**iCal:**
- `ical-generator` — iCal feed generation for OTA sync

---

## 4. Project Structure

```
├── app/                          # Next.js App Router
│   ├── (account)/                # Guest account route group
│   │   ├── account/
│   │   │   ├── bookings/         # My reservations page
│   │   │   └── page.tsx          # Profile page
│   │   └── layout.tsx            # Account layout with nav, auth guard
│   ├── (auth)/                   # Authentication route group
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/              # Dashboard route group (role-protected)
│   │   ├── dashboard/
│   │   │   ├── audit-logs/       # SUPER_ADMIN only
│   │   │   ├── bookings/         # Booking directory & detail
│   │   │   ├── calendar/
│   │   │   ├── channels/         # OTA channel management
│   │   │   ├── content/          # Hero, testimonials, offers editors
│   │   │   ├── front-desk/       # Arrivals/departures, room board, search
│   │   │   ├── profile/
│   │   │   ├── promos/           # Promo code management
│   │   │   ├── reports/
│   │   │   ├── rooms/            # Room inventory & room types
│   │   │   ├── settings/
│   │   │   ├── users/            # SUPER_ADMIN only
│   │   │   └── page.tsx          # Dashboard overview
│   │   └── layout.tsx            # Dashboard layout, role verification
│   ├── api/                      # All API routes
│   │   ├── account/profile/
│   │   ├── auth/                 # login, register, forgot/reset-password
│   │   ├── availability/
│   │   ├── bookings/             # Create & lookup
│   │   ├── contact/
│   │   ├── content/              # Public content endpoints
│   │   ├── dashboard/            # All dashboard CRUD endpoints
│   │   ├── ical/                 # Export & import
│   │   ├── promos/validate/
│   │   ├── room-types/
│   │   └── stripe/               # Checkout & webhook
│   ├── booking/                  # Public booking flow pages
│   │   ├── checkout/
│   │   ├── confirmation/[referenceId]/
│   │   ├── lookup/
│   │   ├── [roomTypeSlug]/
│   │   └── page.tsx
│   ├── policies/cancellation/
│   ├── error.tsx                 # Global error boundary
│   ├── globals.css               # Global styles + design tokens
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   ├── page.tsx                  # Landing page
│   ├── robots.ts                 # SEO robots.txt
│   └── sitemap.ts                # SEO sitemap.xml
│
├── components/
│   ├── landing/                  # Landing page section components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── BookingBar.tsx
│   │   ├── Rooms.tsx
│   │   ├── RoomCard.tsx
│   │   ├── Amenities.tsx
│   │   ├── Gallery.tsx
│   │   ├── SpecialOffers.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Location.tsx
│   │   ├── FAQ.tsx
│   │   ├── Contact.tsx
│   │   ├── Footer.tsx
│   │   └── ScrollAnimations.tsx
│   └── ui/                       # Reusable UI primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── logo.tsx
│       ├── sheet.tsx
│       └── skeleton.tsx
│
├── lib/                          # Shared utilities
│   ├── auth.ts                   # JWT sign/verify, getCurrentUser
│   ├── db.ts                     # PostgreSQL pool & query helpers
│   ├── dual-pricing.ts           # USD/ETB formatting & conversion
│   ├── email.ts                  # Resend SDK email templates
│   ├── notifications.ts          # In-app notification CRUD
│   ├── pdf.ts                    # PDF invoice generator
│   ├── utils.ts                  # cn() utility
│   ├── hooks/
│   │   └── useGSAP.ts            # GSAP + ScrollTrigger hook
│   └── channel-manager/          # OTA channel abstraction
│       ├── types.ts              # ChannelProvider interface
│       ├── manager.ts            # ChannelManager class (push/pull/sync)
│       └── demo-provider.ts      # Demo OTA provider
│
├── public/
│   ├── images/
│   │   ├── gallery/              # Gallery photos (empty)
│   │   └── rooms/                # Room photos (empty)
│   └── placeholder.svg
│
├── proxy.ts                      # Middleware matcher (passthrough)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind theme
├── tsconfig.json                 # TypeScript config
├── eslint.config.mjs             # ESLint config
├── postcss.config.mjs            # PostCSS config
└── package.json                  # Dependencies and scripts
```

---

## 5. Database Schema

The application uses **PostgreSQL** via the `pg` library with raw SQL queries. No ORM is used.

### 5.1 Core Tables

#### `user`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | Auto-increment |
| `name` | VARCHAR(255) | Full name |
| `email` | VARCHAR(255) UNIQUE | Login identifier |
| `password_hash` | VARCHAR(255) | bcrypt hash |
| `role` | VARCHAR(50) | `GUEST`, `STAFF`, `ADMIN`, `SUPER_ADMIN` |
| `phone` | VARCHAR(50) | Contact |
| `created_at` | TIMESTAMP | Default `NOW()` |
| `updated_at` | TIMESTAMP | Default `NOW()` |

#### `room_type`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `slug` | VARCHAR(255) UNIQUE | URL-safe identifier |
| `name` | VARCHAR(255) | Display name |
| `description` | TEXT | |
| `base_price` | DECIMAL(10,2) | Price per night in USD |
| `capacity` | INTEGER | Max guests |
| `bed_config` | VARCHAR(255) | e.g. "1 King Bed" |
| `amenities` | JSONB | Array of amenity names |
| `images` | JSONB | Array of image URLs |
| `ical_import_url` | VARCHAR(500) | OTA blocking URL |

#### `room`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `room_type_id` | INTEGER FK → `room_type.id` | |
| `room_number` | VARCHAR(20) UNIQUE | Physical room number |
| `status` | VARCHAR(50) | `AVAILABLE`, `OCCUPIED`, `RESERVED`, `DIRTY`, `CLEAN`, `MAINTENANCE` |

#### `booking`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `reference_id` | VARCHAR(50) UNIQUE | Human-readable booking ref |
| `user_id` | INTEGER FK → `user.id` NULLABLE | Guest account (optional for walk-ins) |
| `guest_name` | VARCHAR(255) | |
| `guest_email` | VARCHAR(255) | |
| `guest_phone` | VARCHAR(50) | |
| `special_requests` | TEXT | |
| `check_in` | DATE | |
| `check_out` | DATE | |
| `guests` | INTEGER | |
| `status` | VARCHAR(50) | `PENDING`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `NO_SHOW` |
| `payment_method` | VARCHAR(50) | `STRIPE`, `PAY_AT_HOTEL`, `CASH`, `CREDIT_CARD`, `BANK_TRANSFER` |
| `total_price` | DECIMAL(10,2) | |
| `currency` | VARCHAR(10) | Default `USD` |
| `promo_code_id` | INTEGER FK → `promo_code.id` NULLABLE | |
| `source` | VARCHAR(50) | `DIRECT`, `WALK_IN`, `OTA` |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

#### `booking_room`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `booking_id` | INTEGER FK → `booking.id` | |
| `room_id` | INTEGER FK → `room.id` | |
| `price_per_night` | DECIMAL(10,2) | Snapshot at booking time |

#### `payment`
| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PRIMARY KEY | |
| `booking_id` | INTEGER FK → `booking.id` | |
| `amount` | DECIMAL(10,2) | |
| `method` | VARCHAR(50) | |
| `stripe_session_id` | VARCHAR(255) NULLABLE | Stripe reference |
| `status` | VARCHAR(50) | `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED` |
| `created_at` | TIMESTAMP | |

### 5.2 Supporting Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `promo_code` | Discount codes | `code`, `discount_type` (PERCENTAGE/FIXED), `value`, `valid_from`, `valid_to`, `usage_limit`, `used_count`, `active` |
| `notification` | In-app notifications | `type`, `title`, `message`, `reference_id`, `is_read`, `created_at` |
| `contact_message` | Contact form submissions | `name`, `email`, `phone`, `subject`, `message`, `status` (NEW/RESPONDED) |
| `amenity` | Hotel amenities | `name`, `icon`, `active`, `sort_order` |
| `testimonial` | Guest testimonials | `guest_name`, `comment`, `rating`, `active`, `sort_order` |
| `special_offer` | Promotional offers | `title`, `description`, `discount`, `active`, `sort_order` |
| `nearby_attraction` | Location POIs | `name`, `distance`, `active`, `sort_order` |
| `faq` | FAQ entries | `question`, `answer`, `link_text`, `link_href`, `sort_order` |
| `gallery_image` | Photo gallery | `src`, `alt`, `category`, `grid_span`, `sort_order` |
| `hotel_settings` | Global hotel config | `hotel_name`, `address`, `contact_email`, `contact_phone`, `currency`, `checkin_time`, `checkout_time`, `tax_rate`, `etb_conversion_rate`, `hero_content` (JSONB), `telegram_bot_token`, `telegram_chat_id` |
| `channel` | OTA channel config | `name`, `slug`, `api_key`, `api_secret`, `status` (DEMO/CONNECTED/DISCONNECTED/ERROR), `last_sync_at` |
| `channel_mapping` | Room type ↔ OTA mapping | `channel_id` FK, `room_type_id` FK, `external_room_code`, `rate_code`, `sync_enabled` |
| `channel_sync_log` | Sync audit trail | `channel_id` FK, `action`, `status`, `details`, `item_count` |
| `AuditLog` | Dashboard action audit | `action`, `entity`, `entityId`, `details`, `userId`, `timestamp` |

### 5.3 Database Helper (lib/db.ts)

```typescript
// Query helpers exported from lib/db.ts:
query<T>(text: string, params?: any[]): Promise<QueryResult<T>>    // SELECT queries
queryOne<T>(text: string, params?: any[]): Promise<T | null>       // Single row
execute(text: string, params?: any[]): Promise<QueryResult>         // INSERT/UPDATE/DELETE
transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>
testConnection(): Promise<boolean>
```

Uses a singleton `Pool` instance configured via `DATABASE_URL` environment variable.

---

## 6. API Reference

### 6.1 Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Authenticate user, returns JWT cookie | Public |
| POST | `/api/auth/register` | Create GUEST account | Public |
| POST | `/api/auth/forgot-password` | Send password reset email | Public |
| POST | `/api/auth/reset-password` | Reset password with token | Public (token) |

### 6.2 Bookings & Availability

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/availability?checkIn=X&checkOut=Y&guests=Z` | Check room availability | Public |
| POST | `/api/bookings` | Create booking (validates availability, applies promo, sends email) | Public |
| GET | `/api/bookings/lookup?reference=X` | Lookup booking by reference ID | Public |

### 6.3 Payments (Stripe)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/stripe/checkout` | Create Stripe Checkout Session | Public |
| POST | `/api/stripe/webhook` | Stripe webhook (confirms booking on payment success) | Stripe Signature |

### 6.4 Promotions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/promos/validate` | Validate promo code, return discount | Public |

### 6.5 Content (Public)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/content/hero` | Hero section content |
| GET | `/api/content/settings` | Hotel name, address, contact, check-in/out |
| GET | `/api/content/gallery` | Gallery images |
| GET | `/api/content/faq` | FAQ entries |
| GET | `/api/content/amenities` | Amenities |
| GET | `/api/content/nearby-attractions` | Nearby attractions |
| GET | `/api/room-types` | All room types with pricing |

### 6.6 Contact

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/contact` | Submit contact form message |

### 6.7 Dashboard

All dashboard endpoints require **STAFF**, **ADMIN**, or **SUPER_ADMIN** role.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Overview stats (arrivals, departures, occupancy, revenue) |
| GET/POST/PATCH | `/api/dashboard/bookings` | Booking directory CRUD with filters |
| GET | `/api/dashboard/bookings/[id]` | Single booking detail |
| GET | `/api/dashboard/front-desk` | Today's arrivals & departures |
| GET/POST/PATCH | `/api/dashboard/rooms` | Physical room CRUD |
| GET/POST/DELETE | `/api/dashboard/room-types` | Room type CRUD |
| GET/POST/PATCH/DELETE | `/api/dashboard/promos` | Promo code CRUD |
| GET/PATCH | `/api/dashboard/notifications` | Notifications list, mark read |
| GET/PUT | `/api/dashboard/settings` | Hotel settings |
| GET/POST/PATCH/DELETE | `/api/dashboard/users` | User management (SUPER_ADMIN) |
| GET | `/api/dashboard/reports` | Revenue & occupancy reports |
| GET | `/api/dashboard/audit-logs` | Audit log viewer (SUPER_ADMIN) |
| GET/POST/PATCH/DELETE | `/api/dashboard/channels` | OTA channel CRUD |
| POST | `/api/dashboard/channels/[id]/sync` | Trigger OTA sync |
| GET/POST | `/api/dashboard/channels/[id]/mappings` | Room mapping CRUD |
| POST | `/api/dashboard/channels/[id]/test` | Test channel connection |
| GET | `/api/dashboard/channels/sync-logs` | Sync log history |
| GET/PUT | `/api/dashboard/content/hero` | Hero content editor |
| GET/POST/PATCH/DELETE | `/api/dashboard/content/testimonials` | Testimonials CRUD |
| GET/POST/PATCH/DELETE | `/api/dashboard/content/offers` | Special offers CRUD |

### 6.8 iCal (OTA Sync)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ical/export/[roomTypeId]` | Export room type as .ics feed |
| POST | `/api/ical/import` | Import iCal feed, create OTA bookings |
| POST | `/api/ical/import/sync` | Sync all room types' iCal feeds |

### 6.9 Account

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/account/profile` | Current user profile | JWT |

---

## 7. Authentication & Authorization

### 7.1 Authentication Flow

The application uses a **custom JWT-based authentication** system (not NextAuth):

```
1. User submits credentials → POST /api/auth/login
2. Server verifies bcrypt hash against DB
3. Server generates JWT containing { userId, email, role }
4. JWT stored in httpOnly cookie (auth_token), 7-day expiry
5. Subsequent requests read JWT from cookie, verify signature
6. getCurrentUser() extracts and verifies the token
```

### 7.2 Authorization Levels

| Level | Check | Routes |
|---|---|---|
| Public | None | `/`, `/booking/*`, `/api/content/*`, `/api/availability` |
| Authenticated | Valid JWT | `/account/*`, `/api/account/*` |
| Staff+ | Valid JWT + role in [STAFF, ADMIN, SUPER_ADMIN] | `/dashboard/*`, `/api/dashboard/*` |
| Super Admin | Valid JWT + role = SUPER_ADMIN | `/dashboard/users`, `/dashboard/audit-logs` |

### 7.3 JWT Implementation (lib/auth.ts)

```typescript
// Key exports:
signToken(payload: TokenPayload): string    // Creates JWT with 7d expiry
verifyToken(token: string): TokenPayload     // Verifies and decodes JWT
getCurrentUser(): TokenPayload | null        // Reads from request cookies
```

### 7.4 Role-Based Middleware

The dashboard layout (`app/(dashboard)/layout.tsx`) calls `getCurrentUser()` and checks `role` against allowed roles. Unauthorized users are redirected to `/login`.

---

## 8. Booking Flow

### 8.1 User Journey

```
 ┌──────────┐    ┌──────────┐    ┌─────────────┐    ┌──────────┐
 │  Enter    │    │  Browse  │    │  Guest      │    │  Confirm │
 │  Dates    │───→│  Rooms   │───→│  Details +  │───→│  & Pay   │
 │  & Guests │    │  & Rates │    │  Promo Code │    │          │
 └──────────┘    └──────────┘    └──────┬──────┘    └─────┬────┘
                                        │                  │
                                        │                  ▼
                                        │           ┌──────────────┐
                                        │           │  Confirmation │
                                        └──────────→│  Page + Email │
                                                     └──────────────┘
```

### 8.2 Step Details

1. **Date Selection**: Hero widget or BookingBar — sets `checkIn`, `checkOut`, `guests` params
2. **Availability Check** (`/booking`): Server component queries `availability` API, returns matching room types with dual pricing
3. **Room Detail** (`/booking/[slug]`): Room info, amenities, price breakdown with 15% tax
4. **Checkout** (`/booking/checkout`): Client component with:
   - Guest information form (validated with Zod)
   - Promo code application via `/api/promos/validate`
   - Payment method selection (Stripe or Pay at Hotel)
5. **Booking Creation** (`POST /api/bookings`):
   - Validates availability (atomic check with row-level locking)
   - Applies promo code discount
   - Calculates total with tax
   - Creates booking + booking_room records
   - Updates room statuses
   - Sends confirmation email
   - Creates in-app notification
   - Triggers OTA channel sync
   - Returns reference ID
6. **Confirmation** (`/booking/confirmation/[ref]`): Full booking summary, room details, payment info, invoice download (PDF)

### 8.3 Pricing Model

```
Subtotal  = Σ(price_per_night × nights) per room
Discount  = Promo code discount (percentage or fixed)
Tax       = (Subtotal - Discount) × tax_rate (default 15%)
Total     = Subtotal - Discount + Tax
```

Dual currency display: **USD** (primary) and **ETB** (secondary, rate configurable in `hotel_settings`).

---

## 9. Payment System

### 9.1 Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Checkout    │────→│  Stripe          │────→│  Stripe         │
│  Page        │     │  Checkout        │     │  (Hosted Page)  │
│              │     │  Session (API)   │     │                 │
└──────────────┘     └──────────────────┘     └────────┬────────┘
                                                        │
                                                        │ Redirect
                                                        ▼
                                              ┌──────────────────┐
                                              │  Success/Cancel  │
                                              │  Page            │
                                              └────────┬─────────┘
                                                        │
                                              ┌─────────▼────────┐
                                              │  Stripe Webhook  │
                                              │  (Server Event)  │
                                              └─────────┬────────┘
                                                        │
                                              ┌─────────▼────────┐
                                              │  Confirm Booking │
                                              │  Create Payment  │
                                              └──────────────────┘
```

### 9.2 Payment Methods

1. **Pay Online (Stripe)** — Creates Stripe Checkout Session, redirects to Stripe, webhook confirms booking
2. **Pay at Hotel** — Booking created as `PENDING`, guest pays on arrival

### 9.3 Stripe Webhook

The endpoint `POST /api/stripe/webhook` listens for `checkout.session.completed`. On receipt:
- Updates booking status from `PENDING` to `CONFIRMED`
- Creates payment record (status: `COMPLETED`)
- Sends confirmation email
- Creates notification

---

## 10. OTA Channel Manager

### 10.1 Architecture

The Channel Manager is an abstraction layer for integrating with Online Travel Agencies (OTAs) like Booking.com and Expedia.

```
┌──────────────┐
│  Channel     │
│  Manager     │
│  (lib/       │
│  channel-    │
│  manager/)   │
├──────────────┤
│  Providers:  │
│  ┌──────────┐│
│  │  Demo    ││  ← Simulated OTA (use for testing)
│  └──────────┘│
│  ┌──────────┐│
│  │ Booking  ││  ← Real API integration (TBD)
│  │ .com     ││
│  └──────────┘│
│  ┌──────────┐│
│  │ Expedia  ││  ← Real API integration (TBD)
│  └──────────┘│
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Channel Database Tables                    │
│  channel, channel_mapping, channel_sync_log │
└─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  iCal Import/Export System                  │
│  GET /api/ical/export/[roomTypeId]          │
│  POST /api/ical/import                      │
└─────────────────────────────────────────────┘
```

### 10.2 Provider Interface

```typescript
interface ChannelProvider {
  testConnection(): Promise<TestResult>;
  pushAvailability(
    roomMappings: ChannelMapping[],
    startDate: Date,
    endDate: Date
  ): Promise<SyncResult>;
  pushRates(
    roomMappings: ChannelMapping[],
    startDate: Date,
    endDate: Date
  ): Promise<SyncResult>;
  pullReservations(
    roomMappings: ChannelMapping[],
    startDate: Date,
    endDate: Date
  ): Promise<SyncResult>;
}
```

### 10.3 ChannelManager Class

The `ChannelManager` (`lib/channel-manager/manager.ts`) orchestrates:

- **Full Sync**: pushAvailability (30 days) → pushRates (30 days) → pullReservations
- **Availability/Rates Only**: Targeted sync for specific date ranges
- **Reservation Pull Only**: Fetch new bookings from OTA
- **Logging**: All actions recorded in `channel_sync_log` table

### 10.4 Demo Provider

The `DemoProvider` (`lib/channel-manager/demo-provider.ts`) simulates OTA behavior:

- Generates realistic fake data (room names, guest names, countries)
- Configurable failure rate (default 5%)
- Generates 0–3 fake reservations per sync
- Returns realistic latency simulation
- Useful for development and testing without real OTA credentials

### 10.5 iCal System

- **Export**: `GET /api/ical/export/[roomTypeId]` — generates `.ics` file with all blocked dates for a room type
- **Import**: `POST /api/ical/import` — parses uploaded `.ics` URL, creates OTA bookings with reference format `OTA-{uid}`
- **Auto-sync**: `POST /api/ical/import/sync` — syncs all room types configured with `ical_import_url`

---

## 11. Frontend Component Architecture

### 11.1 Landing Page Components

All landing components are in `components/landing/` and are composed in `app/page.tsx`:

| Component | Type | Data Source | Key Features |
|---|---|---|---|
| `Navbar` | Client | `settings` API | Scroll detection, mobile overlay with GSAP |
| `Hero` | Client | `hero` API | Full-screen background, animated widget, stat counters |
| `BookingBar` | Client | — | Sticky bottom bar, collapsible mobile, syncs with Hero |
| `Rooms` | Server | `room-types` API | Room grid, amenity icons, dual pricing |
| `RoomCard` | Client | Props | Image gallery, amenity list, featured highlight |
| `Amenities` | Server | `amenities` API | Icon grid with Lucide icons |
| `Gallery` | Client | `gallery` API | Category filter tabs, lightbox modal |
| `SpecialOffers` | Server | `offers` API | Cards on dark background |
| `Testimonials` | Server | `testimonials` API | Star ratings |
| `Location` | Server | `settings` + `attractions` APIs | Google Maps embed, nearby POIs |
| `FAQ` | Client | `faq` API | Accordion with animated expand/collapse |
| `Contact` | Client | — | Form with Zod validation, honeypot spam prevention |
| `Footer` | Server | `settings` API | Nav links, social icons, address |
| `ScrollAnimations` | Client | — | GSAP ScrollTrigger reveals (stagger, slide) |

### 11.2 UI Primitives

Located in `components/ui/`. Follows the **shadcn/ui** pattern:

| Component | Dependencies | Variants |
|---|---|---|
| `button` | `@radix-ui/react-slot`, `class-variance-authority` | default, destructive, outline, secondary, ghost, link + sizes |
| `card` | — | Skeleton with className passthrough |
| `input` | — | Styled with focus ring, error state support |
| `label` | `@radix-ui/react-label` | Peer focus styling |
| `sheet` | `@radix-ui/react-dialog` | Slide-out panel with overlay |
| `skeleton` | — | Loading placeholder with pulse animation |
| `logo` | — | `onDark`/`onLight` variants, `sm`/`default` sizes |

### 11.3 Server/Client Component Boundary Rules

- **Server Components** fetch data directly (no API calls from client) — used for all read-only content
- **Client Components** handle interactivity — use `"use client"` directive
- **Data mutations** go through API routes (POST/PATCH/DELETE)
- **Forms** use `react-hook-form` + `zod` resolvers on the client

---

## 12. Design System

### 12.1 Theme Configuration

Defined in `tailwind.config.ts` with CSS custom properties in `globals.css`.

**Color Palette:**
- **Background**: `#FDFBF7` (warm ivory) with `#F8F5F0` for muted sections
- **Foreground**: `#1A1A1A` (near-black)
- **Primary (Gold)**: `#C8A96E` with hover `#B8955A`
- **Accent**: `#2C3E50` (deep navy)
- **Muted**: Warm grays for subtle backgrounds

### 12.2 Typography

| Usage | Font | Weight |
|---|---|---|
| Body | Google Sans (Inter-like) | 300–700 |
| Headings | Funnel Display | 400–700 |
| Monospace | JetBrains Mono | Coding |

CSS variables applied as `--font-body`, `--font-heading`, `--font-mono`.

### 12.3 Key Visual Elements

- **Border radius**: `rounded-sm` (subtle rounding) for cards, `rounded-full` for pills
- **Shadows**: Subtle `shadow-sm` for cards, `shadow-lg` for modals
- **Animations**: GSAP with ScrollTrigger for scroll reveals (stagger children, slide-up, fade-in)
- **Transitions**: `next-view-transitions` for page transitions

---

## 13. Notifications & Email

### 13.1 In-App Notifications

System for staff-facing real-time alerts.

**Notification Types:**
- `BOOKING_NEW` — New booking received
- `BOOKING_CHECK_IN` — Guest checked in
- `BOOKING_CHECK_OUT` — Guest checked out
- `BOOKING_CANCELLED` — Booking cancelled
- `PAYMENT_RECEIVED` — Payment completed
- `CONTACT_MESSAGE` — New contact form submission
- `CHANNEL_SYNC` — OTA sync completed/failed

**Dashboard Integration:**
- Notification bell in dashboard header
- Polling every 15 seconds for new alerts
- Unread count badge
- Mark as read / Mark all as read

### 13.2 Email System

Uses **Resend** SDK for transactional email delivery.

**Templates:**
- `sendPasswordResetEmail(to, token)` — Password reset link
- `sendBookingConfirmationEmail(booking)` — Booking confirmation with details
- `sendCancellationEmail(booking)` — Cancellation notice

**Fallback:** If `RESEND_API_KEY` is not set, emails are logged to console in development.

### 13.3 PDF Generation

Invoice PDFs are generated using **jsPDF** + **jsPDF AutoTable** with:
- Hotel header (name, address, contact)
- Booking reference, dates, guest info
- Room details table (room type, nights, price per night)
- Subtotal, discount, tax, total breakdown
- Payment status and method

---

## 14. SEO & Metadata

### 14.1 Global Metadata

Defined in `app/layout.tsx`:
- Title template: `"%s | Eset Hotel"`
- Default title: "Eset Hotel — Your Home Away From Home"
- Description: Full SEO-optimized description
- Keywords: Hotel-specific terms
- OpenGraph: title, description, type (website)

### 14.2 robots.txt

Generated by `app/robots.ts`:
- **Allow**: `/`
- **Disallow**: `/dashboard/`, `/api/`, `/account/`

### 14.3 Sitemap

Generated by `app/sitemap.ts`:
- Pages: `/`, `/booking`, `/login`, `/register`, `/policies/cancellation`
- Change frequency: `daily`
- Priority: `1.0` for home page

---

## 15. Environment Configuration

### 15.1 Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon.tech) |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `RESEND_API_KEY` | No | Resend API key for transactional emails |
| `EMAIL_FROM` | No | From email address (default: Eset Hotel <no-reply@esethotel.com>) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |

### 15.2 Configuration File

Copy `.env.example` → `.env` and fill in values:

```bash
cp .env.example .env
```

---

## 16. Development & Deployment

### 16.1 Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL, JWT secret, etc.

# Initialize database
# Run SQL schema migrations (see database tables section)

# Start development server
npm run dev
```

### 16.2 Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Development server on port 3000 |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint on all files |

### 16.3 Build & Deployment

```bash
# Production build
npm run build

# Start production server
npm start
```

The application deploys as a standard Next.js application. Recommended platforms:
- **Vercel** (optimized for Next.js)
- **Docker** container with Node.js server
- Any Node.js hosting with PostgreSQL access

### 16.4 Database Setup

The application expects the PostgreSQL schema to exist. Tables are queried directly (no migrations framework). Recommended approach:

1. Define schema SQL in a `schema.sql` file
2. Run against Neon.tech database on first deployment
3. Update schema manually for changes

---

## Appendices

### A. Key File Map

| Purpose | Path |
|---|---|
| Root layout & metadata | [`app/layout.tsx`](app/layout.tsx) |
| Landing page composition | [`app/page.tsx`](app/page.tsx) |
| Database helpers | [`lib/db.ts`](lib/db.ts) |
| Authentication | [`lib/auth.ts`](lib/auth.ts) |
| JWT login API | [`app/api/auth/login/route.ts`](app/api/auth/login/route.ts) |
| Booking creation API | [`app/api/bookings/route.ts`](app/api/bookings/route.ts) |
| Availability check API | [`app/api/availability/route.ts`](app/api/availability/route.ts) |
| Stripe webhook | [`app/api/stripe/webhook/route.ts`](app/api/stripe/webhook/route.ts) |
| Channel manager | [`lib/channel-manager/manager.ts`](lib/channel-manager/manager.ts) |
| Dashboard layout (auth guard) | [`app/(dashboard)/layout.tsx`](app/(dashboard)/layout.tsx) |
| Design system tokens | [`tailwind.config.ts`](tailwind.config.ts) |
| Global styles | [`app/globals.css`](app/globals.css) |

### B. Data Flow Diagrams

**Booking Creation Flow:**
```
Client                         Server                        Database
  │                              │                              │
  │  POST /api/bookings          │                              │
  │─────────────────────────────→│                              │
  │                              │  BEGIN TRANSACTION           │
  │                              │─────────────────────────────→│
  │                              │  CHECK availability          │
  │                              │─────────────────────────────→│
  │                              │  APPLY promo (if any)        │
  │                              │─────────────────────────────→│
  │                              │  CREATE booking              │
  │                              │─────────────────────────────→│
  │                              │  CREATE booking_room rows    │
  │                              │─────────────────────────────→│
  │                              │  UPDATE room statuses        │
  │                              │─────────────────────────────→│
  │                              │  COMMIT                      │
  │                              │─────────────────────────────→│
  │                              │                              │
  │                              │  SEND confirmation email     │
  │                              │  (async)                     │
  │                              │                              │
  │                              │  CREATE notification         │
  │                              │                              │
  │  { booking, referenceId }    │                              │
  │←─────────────────────────────│                              │
```

**Dashboard Authentication Flow:**
```
Client                        Server
  │                              │
  │  GET /dashboard/*            │
  │─────────────────────────────→│
  │                              │  Read auth_token cookie
  │                              │  Verify JWT signature
  │                              │  Extract { userId, role }
  │                              │
  │                              │  if role ∉ [STAFF, ADMIN, SUPER_ADMIN]
  │                              │    → Redirect /login
  │                              │
  │                              │  Render dashboard layout
  │←─────────────────────────────│
```

### C. Tax & Pricing Calculation

```
nights        = ceil((checkOut - checkIn) / 86400000)
rawSubtotal   = basePrice × nights
promoDiscount = rawSubtotal × promoValue (if PERCENTAGE)
               | promoValue          (if FIXED)
subtotal      = rawSubtotal - promoDiscount
tax           = subtotal × taxRate   (default 0.15)
total         = subtotal + tax
```

### D. Design System Variables

```css
:root {
  --background: #FDFBF7;
  --foreground: #1A1A1A;
  --primary: #C8A96E;
  --primary-hover: #B8955A;
  --accent: #2C3E50;
  --muted: #F0EDE6;
  --muted-foreground: #78736A;
  --radius: 0.125rem;
}
```
