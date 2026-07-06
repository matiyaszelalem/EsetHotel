import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Hotel, User as UserIcon, ClipboardList, LogOut } from 'lucide-react'

async function handleSignOut() {
  'use server'
  // TODO: Implement sign out logic
  redirect('/')
}

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Add authentication check
  const user = null
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Navbar */}
      <header className="h-16 bg-card border-b border-border sticky top-0 z-40 shadow-sm flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary">
              <Hotel size={16} className="text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">Eset Hotel</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-semibold text-muted-foreground">
            <Link href="/account/bookings" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <ClipboardList size={16} />
              <span>My Reservations</span>
            </Link>
            <Link href="/account" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <UserIcon size={16} />
              <span>My Profile</span>
            </Link>
            <div className="h-6 w-px bg-border"></div>
            <form action={handleSignOut}>
              <button 
                type="submit" 
                className="hover:text-destructive transition-colors flex items-center gap-1.5 text-xs text-muted-foreground font-medium"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main page */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        {children}
      </main>
    </div>
  )
}
