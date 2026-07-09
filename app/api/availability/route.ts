import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const checkInStr = searchParams.get('checkIn')
    const checkOutStr = searchParams.get('checkOut')
    let guests = parseInt(searchParams.get('guests') || '1', 10)

    if (isNaN(guests) || guests < 1) guests = 1

    if (!checkInStr || !checkOutStr) {
      return NextResponse.json({ error: 'Missing checkIn or checkOut dates' }, { status: 400 })
    }

    const checkInDate = new Date(checkInStr)
    const checkOutDate = new Date(checkOutStr)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    if (checkInDate < today) {
      return NextResponse.json({ error: 'Check-in date cannot be in the past' }, { status: 400 })
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 })
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000)
    if (nights < 1) {
      return NextResponse.json({ error: 'Minimum stay is 1 night' }, { status: 400 })
    }

    const roomTypes = await query<{
      id: string
      slug: string
      name: string
      description: string | null
      base_price: number
      capacity: number
      bed_config: string | null
      amenities: string
      images: string
    }>(
      'SELECT * FROM room_type WHERE capacity >= $1',
      [guests]
    )

    const allRooms = await query<{
      id: string
      room_number: string
      room_type_id: string
      status: string
    }>(
      'SELECT id, room_number, room_type_id, status FROM room'
    )

    const bookedRoomIdsResult = await query<{ room_id: string }>(
      `SELECT DISTINCT br.room_id FROM booking_room br
       JOIN booking b ON b.id = br.booking_id
       WHERE b.status NOT IN ('CANCELLED', 'NO_SHOW', 'CHECKED_OUT')
       AND b.check_in < $2
       AND b.check_out > $1`,
      [checkInDate.toISOString(), checkOutDate.toISOString()]
    )

    const bookedRoomIds = new Set(bookedRoomIdsResult.map(r => r.room_id))

    const roomsByType = new Map<string, typeof allRooms>()
    for (const room of allRooms) {
      const arr = roomsByType.get(room.room_type_id) || []
      arr.push(room)
      roomsByType.set(room.room_type_id, arr)
    }

    const availableRoomTypes = roomTypes.map(type => {
      const physicalRooms = roomsByType.get(type.id) || []
      const availablePhysicalRooms = physicalRooms.filter(
        room => room.status === 'AVAILABLE' && !bookedRoomIds.has(room.id)
      )

      return {
        id: type.id,
        slug: type.slug,
        name: type.name,
        description: type.description,
        basePrice: type.base_price,
        capacity: type.capacity,
        bedConfig: type.bed_config,
        amenities: JSON.parse(type.amenities || '[]'),
        images: JSON.parse(type.images || '[]'),
        availableCount: availablePhysicalRooms.length,
      }
    }).filter(type => type.availableCount > 0)

    return NextResponse.json({ availableRoomTypes })
  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
  }
}
