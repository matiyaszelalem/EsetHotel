const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('NO .env FILE');
  process.exit(1);
}
const envText = fs.readFileSync(envPath, 'utf8');
envText.split(/\r?\n/).forEach((line) => {
  const match = line.match(/^\s*([^#][^=]*)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('NO DATABASE_URL');
  process.exit(1);
}
console.log('DATABASE_URL:', url.startsWith('postgres') ? 'postgres-present' : url);

(async () => {
  try {
    const sql = neon(url);
    const summary = await sql.query(
      `WITH today AS (SELECT $1::date AS d)
       SELECT
         (SELECT COUNT(*)::text FROM room) AS total_rooms,
         (SELECT COUNT(*)::text FROM booking_room br
            JOIN booking b ON b.id = br.booking_id
            JOIN today t ON TRUE
            WHERE b.status IN ('CONFIRMED', 'CHECKED_IN')
              AND t.d BETWEEN b.check_in AND b.check_out) AS occupied_rooms,
         (SELECT COUNT(*)::text FROM booking b
            JOIN today t ON TRUE
            WHERE b.status IN ('CONFIRMED', 'CHECKED_IN')
              AND b.check_in = t.d) AS arrivals,
         (SELECT COUNT(*)::text FROM booking b
            JOIN today t ON TRUE
            WHERE b.status IN ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT')
              AND b.check_out = t.d) AS departures,
         (SELECT COALESCE(SUM(amount), 0)::text FROM payment p
            JOIN today t ON TRUE
            WHERE p.status = 'COMPLETED'
              AND DATE(p.created_at) = t.d) AS revenue_today
      `,
      [new Date().toISOString().split('T')[0]]
    );
    console.log('SUMMARY', JSON.stringify(summary, null, 2));

    const recent = await sql.query(
      `WITH recent_bookings AS (
         SELECT id, reference_id, guest_name, guest_email, check_in, check_out,
                status, total_price, payment_method, created_at
         FROM booking
         ORDER BY created_at DESC
         LIMIT 10
       )
       SELECT b.id, b.reference_id, b.guest_name, b.guest_email,
              b.check_in, b.check_out, b.status, b.total_price, b.payment_method, b.created_at,
              COALESCE(json_agg(json_build_object(
                'roomNumber', r.room_number,
                'roomType', json_build_object('name', rt.name)
              )) FILTER (WHERE r.id IS NOT NULL), '[]') AS rooms
       FROM recent_bookings b
       LEFT JOIN booking_room br ON br.booking_id = b.id
       LEFT JOIN room r ON r.id = br.room_id
       LEFT JOIN room_type rt ON rt.id = r.room_type_id
       GROUP BY b.id
       ORDER BY b.created_at DESC`
    );
    console.log('RECENT', JSON.stringify(recent, null, 2));
  } catch (err) {
    console.error('SQL ERROR', err && err.message ? err.message : err);
    if (err && err.code) console.error('SQL CODE', err.code);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
