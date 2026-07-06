import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production'

export interface JwtUser {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
}

export function signToken(user: JwtUser): string {
  return jwt.sign(user, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtUser | null {
  try {
    return jwt.verify(token, SECRET) as JwtUser
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<JwtUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return verifyToken(token)
}
