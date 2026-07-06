import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export async function GET() {
  const databaseUrlPresent = !!normalizeEnvValue(process.env.DATABASE_URL)
  const jwtSecretPresent = !!normalizeEnvValue(process.env.JWT_SECRET)

  try {
    const result = await query<{ ok: number }>('SELECT 1 AS ok')
    const dbOk = result?.[0]?.ok === 1
    return NextResponse.json({ status: 'ok', dbOk, databaseUrlPresent, jwtSecretPresent })
  } catch (error: any) {
    console.error('Debug health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error?.message || 'Database connectivity error',
        databaseUrlPresent,
        jwtSecretPresent,
      },
      { status: 500 }
    )
  }
}
