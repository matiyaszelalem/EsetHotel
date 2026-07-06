import { neon, Pool } from '@neondatabase/serverless'
import type { QueryResultRow } from 'pg'

const sql = neon(process.env.DATABASE_URL!)

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  return sql.query(text, params) as Promise<T[]>
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await sql.query(text, params) as T[]
  return rows[0] ?? null
}

export async function execute(
  text: string,
  params?: unknown[]
): Promise<{ rowCount: number }> {
  const result = await sql.query(text, params, { fullResults: true }) as any
  return { rowCount: result.rowCount ?? 0 }
}

interface TransactionClient {
  query: <R extends QueryResultRow>(text: string, params?: unknown[]) => Promise<R[]>
  queryOne: <R extends QueryResultRow>(text: string, params?: unknown[]) => Promise<R | null>
  execute: (text: string, params?: unknown[]) => Promise<{ rowCount: number }>
}

export async function transaction<T>(
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const tx: TransactionClient = {
      query: async <R extends QueryResultRow>(text: string, params?: unknown[]) => {
        const result = await client.query(text, params)
        return result.rows as R[]
      },
      queryOne: async <R extends QueryResultRow>(text: string, params?: unknown[]) => {
        const result = await client.query(text, params)
        return (result.rows[0] as R | undefined) ?? null
      },
      execute: async (text: string, params?: unknown[]) => {
        const result = await client.query(text, params)
        return { rowCount: result.rowCount ?? 0 }
      },
    }
    const result = await fn(tx)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
    await pool.end()
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await sql.query('SELECT 1')
    return true
  } catch {
    return false
  }
}
