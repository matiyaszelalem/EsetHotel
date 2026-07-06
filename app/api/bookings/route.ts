import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { query, queryOne, transaction } from '@/lib/db'

function generateReferenceId(): string {
  const part1 = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase()
  const part2 = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase()
  return `ESH-${part1}-${part2}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      roomSlug,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      guests,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      paymentMethod,
      promoCode,
      verificationMethod,
      verificationData
    } = body

    if (!roomSlug || !checkInStr || !checkOutStr || !guestName || !guestEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const checkIn = new Date(checkInStr)
    const checkOut = new Date(checkOutStr)

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    if (checkIn < today) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past' }, { status: 400 })
    }

    if (checkOut <= checkIn) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000)
    if (nights < 1) {
      return NextResponse.json({ error: 'Minimum stay is 1 night' }, { status: 400 })
    }

    const rawGuests = parseInt(guests)
    const guestCount = !isNaN(rawGuests) && rawGuests >= 1 ? rawGuests : 1

    const settings = await queryOne<{ tax_rate: number; etb_conversion_rate: number }>(
      'SELECT tax_rate, etb_conversion_rate FROM hotel_settings LIMIT 1'
    )
    const taxRate = Number(settings?.tax_rate ?? 0.15)

    const roomType = await queryOne<{
      id: string; name: string; slug: string; base_price: number; capacity: number
    }>(
      'SELECT id, name, slug, base_price, capacity FROM room_type WHERE slug = $1',
      [roomSlug]
    )

    if (!roomType) {
      return NextResponse.json({ error: 'Room category not found' }, { status: 404 })
    }

    const bookedRoomIds = await query<{ room_id: string }>(
      `SELECT DISTINCT br.room_id FROM booking_room br
       JOIN booking b ON b.id = br.booking_id
       JOIN room r ON r.id = br.room_id
       WHERE b.status NOT IN ('CANCELLED')
       AND r.room_type_id = $1
       AND b.check_in < $3
       AND b.check_out > $2`,
      [roomType.id, checkIn.toISOString(), checkOut.toISOString()]
    )

    const bookedIds = bookedRoomIds.map(br => br.room_id)
    const availableRooms = bookedIds.length > 0
      ? await query<{ id: string; room_number: string }>(
          `SELECT id, room_number FROM room
           WHERE room_type_id = $1
           AND status != 'MAINTENANCE'
           AND id != ALL($2)`,
          [roomType.id, bookedIds]
        )
      : await query<{ id: string; room_number: string }>(
          `SELECT id, room_number FROM room
           WHERE room_type_id = $1
           AND status != 'MAINTENANCE'`,
          [roomType.id]
        )

    if (availableRooms.length === 0) {
      return NextResponse.json({ error: 'No rooms available for the selected dates' }, { status: 400 })
    }

    const assignedRoom = availableRooms[0]

    let booking!: { id: string; reference_id: string }
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        booking = await transaction(async (tx) => {
          const roomIds = [assignedRoom.id]
          const locked = await tx.query<{ id: string }>(
            `SELECT id FROM room
             WHERE id = ANY($1::int[])
               AND status = 'AVAILABLE'
             FOR UPDATE SKIP LOCKED`,
            [roomIds]
          )

          if (locked.length !== roomIds.length) {
            throw new Error('ROOMS_UNAVAILABLE')
          }

          let appliedPromoId: string | null = null
          let discountType: string | null = null
          let discountValue: number | null = null

          if (promoCode) {
            const promoResult = await tx.queryOne<{
              id: string; discount_type: string; value: number
            }>(
              `UPDATE promo_code
               SET used_count = used_count + 1
               WHERE code = $1
                 AND active = true
                 AND (usage_limit IS NULL OR used_count < usage_limit)
                 AND NOW() BETWEEN valid_from AND valid_to
               RETURNING id, discount_type, value`,
              [promoCode]
            )

            if (!promoResult) {
              throw new Error('PROMO_INVALID_OR_EXHAUSTED')
            }

            appliedPromoId = promoResult.id
            discountType = promoResult.discount_type
            discountValue = promoResult.value
          }

          let subtotal = nights * roomType.base_price

          if (discountType === 'PERCENTAGE') {
            subtotal = parseFloat((subtotal * (1 - discountValue! / 100)).toFixed(2))
          } else if (discountType === 'FIXED') {
            subtotal = Math.max(0, subtotal - discountValue!)
          }

          const taxes = subtotal * taxRate
          const totalPrice = subtotal + taxes

          const b = await tx.queryOne<{
            id: string; reference_id: string
          }>(
            `INSERT INTO booking (reference_id, user_id, guest_name, guest_email, guest_phone,
              special_requests, check_in, check_out, guests, status, payment_method,
              total_price, promo_code_id, applied_tax_rate, source)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'DIRECT')
             RETURNING id, reference_id`,
            [
              generateReferenceId(),
              null,
              guestName,
              guestEmail,
              guestPhone || null,
              specialRequests || null,
              checkIn.toISOString(),
              checkOut.toISOString(),
              guestCount,
              paymentMethod === 'bank_transfer' ? 'PENDING' : paymentMethod === 'stripe' ? 'PENDING' : 'CONFIRMED',
              paymentMethod === 'bank_transfer' ? 'BANK_TRANSFER' : paymentMethod === 'stripe' ? 'STRIPE' : 'PAY_AT_HOTEL',
              totalPrice,
              appliedPromoId,
              taxRate,
            ]
          )

          await tx.execute(
            'INSERT INTO booking_room (booking_id, room_id, price_per_night) VALUES ($1, $2, $3)',
            [b!.id, assignedRoom.id, roomType.base_price]
          )

          await tx.execute(
            "UPDATE room SET status = 'BOOKED' WHERE id = $1",
            [assignedRoom.id]
          )

          await tx.execute(
            'INSERT INTO payment (booking_id, amount, status, verification_method, verification_data) VALUES ($1, $2, $3, $4, $5)',
            [b!.id, totalPrice, 'PENDING', verificationMethod || null, verificationData || null]
          )

          return b!
        })
        break
      } catch (err: any) {
        if (attempt < 3 && err?.code === '23505') continue
        throw err
      }
    }

    try {
      const { sendBookingConfirmationEmail } = await import('@/lib/email')
      const { channelManager } = await import('@/lib/channel-manager/manager')
      const { createNotification } = await import('@/lib/notifications')

      void sendBookingConfirmationEmail(booking)
      await channelManager.pushAvailabilityToAll()
      await createNotification(
        'BOOKING_NEW',
        'New Booking',
        `${guestName} — ${roomType.name} (${booking.reference_id})`,
        booking.reference_id
      )
    } catch (notificationError) {
      console.error('Notification / Sync dispatch failed:', notificationError)
    }

    return NextResponse.json({ success: true, referenceId: booking.reference_id })
  } catch (error) {
    if (error instanceof Error && error.message === 'ROOMS_UNAVAILABLE') {
      return NextResponse.json({ error: 'Room is no longer available' }, { status: 409 })
    }
    if (error instanceof Error && error.message === 'PROMO_INVALID_OR_EXHAUSTED') {
      return NextResponse.json({ error: 'Promo code is invalid, expired, or fully redeemed' }, { status: 400 })
    }
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
