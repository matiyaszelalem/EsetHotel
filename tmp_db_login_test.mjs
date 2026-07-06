import fs from 'fs'
import { neon } from '@neondatabase/serverless'
import { compare } from 'bcryptjs'

const env = {}
for (const raw of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const line = raw.trim()
  if (!line || line.startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx < 0) continue
  env[line.slice(0, idx)] = line.slice(idx + 1).replace(/^"|"$/g, '')
}

const sql = neon(env.DATABASE_URL)
const email = 'matiyas@esethotel.com'
const passwordToTest = '1234567890'

try {
  const rows = await sql.query('SELECT id, email, password_hash, role FROM "user" WHERE email = $1 LIMIT 1', [email])
  console.log('fetched rows:', rows)
  if (!rows.length) {
    console.error('No user found for email', email)
    process.exit(1)
  }
  const user = rows[0]
  const valid = await compare(passwordToTest, user.password_hash)
  console.log('compare result for password', passwordToTest, ':', valid)
} catch (err) {
  console.error('DB/login test error:', err)
  process.exit(1)
}
