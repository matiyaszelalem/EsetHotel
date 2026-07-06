import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query(
      `SELECT al.id, al.action, al.entity as entity_type, al."entityId" as entity_id, al.details,
              al."createdAt",
              json_build_object('name', u.name, 'email', u.email, 'role', u.role) as "user"
       FROM "AuditLog" al
       LEFT JOIN "user" u ON u.id::text = al."userId"
       ORDER BY al."createdAt" DESC
       LIMIT 100`
    )
    return NextResponse.json(rows.map((r: any) => ({
      id: r.id, action: r.action, entityType: r.entity_type,
      entityId: r.entity_id, details: r.details,
      createdAt: r.createdAt,
      user: r.user,
    })))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
