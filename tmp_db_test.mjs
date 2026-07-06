import fs from 'fs'
import { neon } from '@neondatabase/serverless'
const env = {}
for (const raw of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const line = raw.trim()
  if (!line || line.startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx < 0) continue
  env[line.slice(0, idx)] = line.slice(idx + 1).replace(/^"|"$/g, '')
}
console.log('DATABASE_URL:', env.DATABASE_URL?.slice(0, 40), '...')
const sql = neon(env.DATABASE_URL)
try {
  const result = await sql.query('SELECT 1')
  console.log('SELECT 1 result:', result)
  const users = await sql.query('SELECT id, email FROM "user" LIMIT 1')
  console.log('USER row count:', users.length, 'rows:', users)
} catch (err) {
  console.error('DB error:', err)
  process.exit(1)
}
