'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function handleSignOut() {
  const cookieStore = await cookies()
  cookieStore.set('auth_token', '', { maxAge: 0, path: '/' })
  redirect('/login')
}
