import { redirect } from 'next/navigation'
import { DashboardShell } from './_shell'
import { getCurrentUser } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const allowed = ['STAFF', 'ADMIN', 'SUPER_ADMIN']
  if (!allowed.includes(user.role)) {
    redirect('/')
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
