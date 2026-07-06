import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  try {
    const totalRoomsRes = await queryOne<{ count: string }>('SELECT COUNT(*)::text as count FROM room')
    const totalRoomsCount = parseInt(totalRoomsRes?.count || '0')

    const occupancyData = await query(
      `SELECT d::date as date,
              COUNT(DISTINCT br.room_id)::int as occupied,
              ROUND((COUNT(DISTINCT br.room_id)::numeric / $1::numeric) * 100, 1) as rate
       FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '1 day') d
       LEFT JOIN booking b ON b.status IN ('CONFIRMED', 'CHECKED_IN')
         AND d::date BETWEEN b.check_in AND b.check_out
       LEFT JOIN booking_room br ON br.booking_id = b.id
       GROUP BY d::date
       ORDER BY d::date`, [totalRoomsCount]
    )

    const revenueData = await query(
      `SELECT DATE(p.created_at) as date, COALESCE(SUM(p.amount), 0)::float as revenue
       FROM payment p
       WHERE p.status = 'COMPLETED'
         AND p.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(p.created_at)
       ORDER BY DATE(p.created_at)`
    )

    const totalCompletedRevenue = await queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0)::float as total
       FROM payment
       WHERE status = 'COMPLETED'
         AND created_at >= CURRENT_DATE - INTERVAL '30 days'`
    )

    const occupiedNights = await queryOne<{ nights: number }>(
      `SELECT COALESCE(SUM(
         CASE
           WHEN b.check_out::date <= CURRENT_DATE THEN (b.check_out::date - b.check_in::date)
           ELSE (CURRENT_DATE - b.check_in::date)
         END
       ), 0)::int as nights
       FROM booking b
       WHERE b.status IN ('CONFIRMED', 'CHECKED_IN')
         AND b.check_in::date <= CURRENT_DATE`
    )

    const adr = occupiedNights && occupiedNights.nights > 0
      ? (totalCompletedRevenue?.total || 0) / occupiedNights.nights
      : 0

    const revpar = totalRoomsCount > 0
      ? (totalCompletedRevenue?.total || 0) / (totalRoomsCount * 30)
      : 0

    const sourceBreakdown = await query(
      `SELECT source, COUNT(*)::int as count
       FROM booking
       GROUP BY source`
    )

    const cancellationRate = await query(
      `SELECT to_char(date_trunc('month', created_at), 'Mon') as month,
              date_trunc('month', created_at) as month_sort,
              COUNT(*)::int as total,
              SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END)::int as cancelled,
              ROUND((SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric) * 100, 1) as rate
       FROM booking
       WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY date_trunc('month', created_at)
       ORDER BY month_sort`
    )

    const response = NextResponse.json({
      occupancyData: occupancyData.map((r: any) => ({
        date: r.date, rate: parseFloat(r.rate) || 0, occupied: parseInt(r.occupied) || 0,
      })),
      revenueData: revenueData.map((r: any) => ({
        date: r.date, revenue: parseFloat(r.revenue) || 0,
      })),
      totalRooms: totalRoomsCount,
      sourceBreakdown: Object.fromEntries(
        sourceBreakdown.map((r: any) => [r.source, parseInt(r.count)])
      ),
      cancellationRate: cancellationRate.map((r: any) => ({
        month: r.month, rate: parseFloat(r.rate) || 0,
        total: parseInt(r.total), cancelled: parseInt(r.cancelled),
      })),
      adr: Math.round(adr * 100) / 100,
      revpar: Math.round(revpar * 100) / 100,
    })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
