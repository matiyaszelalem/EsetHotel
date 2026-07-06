'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Calendar, 
  Bed, 
  Tag, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  ConciergeBell,
  Search,
  ClipboardList,
  Star,
  ShieldAlert,
  Globe,
  Users,
  Menu,
  X,
  ChevronRight,
  UserCircle,
  XCircle,
  Clock,
  CheckCircle,
  Info,
  DollarSign,
  Mail,
  RefreshCw,
  LogIn,
  LogOut as LogOutIcon,
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { handleSignOut } from './_actions'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] },
  { name: 'Front Desk', href: '/dashboard/front-desk', icon: ConciergeBell, roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] },
  { name: 'Bookings', href: '/dashboard/bookings', icon: ClipboardList, roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar, roles: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] },
  { name: 'Rooms & Rates', href: '/dashboard/rooms', icon: Bed, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { name: 'Promo Codes', href: '/dashboard/promos', icon: Tag, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { name: 'Content', href: '/dashboard/content', icon: Star, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: ShieldAlert, roles: ['SUPER_ADMIN'] },
  { name: 'Channels', href: '/dashboard/channels', icon: Globe, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['SUPER_ADMIN'] },
  { name: 'Hotel Settings', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN', 'SUPER_ADMIN'] },
]

export function DashboardShell({ children, user }: { children: React.ReactNode; user: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/account/profile')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setCurrentUser(data)
        }
      })
      .catch(() => {})
  }, [])

  const userRole = currentUser?.role || 'STAFF'
  const userInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
  const allowedNav = navigation.filter(item => item.roles.includes(userRole))

  const formatRole = (role: string) => role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/dashboard/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {}
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      stopPolling()
      interval = setInterval(fetchNotifications, 60000)
    }

    const stopPolling = () => {
      if (interval !== null) {
        clearInterval(interval)
        interval = null
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') startPolling()
      else stopPolling()
    }

    fetchNotifications()
    startPolling()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const markAllRead = async () => {
    try {
      await fetch('/api/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {}
  }

  const markOneRead = async (id: string) => {
    try {
      await fetch('/api/dashboard/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch {}
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_NEW': return { icon: CheckCircle, color: 'text-success' }
      case 'BOOKING_CHECK_IN': return { icon: LogIn, color: 'text-primary' }
      case 'BOOKING_CHECK_OUT': return { icon: LogOutIcon, color: 'text-info' }
      case 'BOOKING_CANCELLED': return { icon: XCircle, color: 'text-destructive' }
      case 'PAYMENT_RECEIVED': return { icon: DollarSign, color: 'text-success' }
      case 'CONTACT_MESSAGE': return { icon: Mail, color: 'text-warning' }
      case 'CHANNEL_SYNC': return { icon: RefreshCw, color: 'text-info' }
      default: return { icon: Bell, color: 'text-muted-foreground' }
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const NavLinks = ({ mobile = false, onClick }: { mobile?: boolean; onClick?: () => void }) => (
    <nav className={`flex-1 ${mobile ? 'py-4 px-3' : 'py-6 px-4'} space-y-1 overflow-y-auto`}>
      {allowedNav.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary/15 text-primary font-semibold'
                : mobile
                  ? 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={18} className={isActive ? 'text-primary' : ''} />
            <span className="flex-1">{item.name}</span>
            {mobile && <ChevronRight size={14} className="text-muted-foreground" />}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-[260px] bg-ink text-primary-foreground flex-shrink-0 border-r border-ink-border">
        <div className="h-16 flex items-center px-6 border-b border-ink-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo variant="onDark" size="sm" />
          </Link>
        </div>

        <NavLinks />

        <div className="p-4 border-t border-ink-border bg-black/20">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 mb-3 rounded-lg hover:bg-white/5 -mx-1 px-1 py-1.5 transition-colors group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 font-semibold text-sm group-hover:bg-primary/30 transition-colors">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate group-hover:text-primary-light transition-colors">{currentUser?.name || currentUser?.email}</p>
              <p className="text-xs text-white/50 truncate">{currentUser?.email}</p>
            </div>
            <UserCircle size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
          </Link>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-white/40 hover:text-destructive hover:bg-destructive/10 rounded-[6px] transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r border-border transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
            <Logo variant="onLight" size="sm" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <NavLinks mobile onClick={() => setMobileMenuOpen(false)} />

        <div className="p-4 border-t border-border bg-muted/30">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 mb-3 rounded-lg hover:bg-muted -mx-1 px-1 py-1.5 transition-colors group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm group-hover:bg-primary/20 transition-colors">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{currentUser?.name || currentUser?.email}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
            </div>
            <UserCircle size={14} className="text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
          </Link>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-[6px] transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="md:hidden"><Logo variant="onLight" size="sm" /></span>
            <div className="hidden sm:flex items-center gap-2 bg-muted border border-border rounded-[8px] px-3 py-1.5 w-48 lg:w-64 text-muted-foreground focus-within:border-primary focus-within:bg-background transition-all">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search bookings..." 
                className="bg-transparent border-none text-xs text-foreground outline-none w-full placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-96 bg-background border border-border rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((n) => {
                          const { icon: Icon, color } = getNotificationIcon(n.type)
                          return (
                            <div
                              key={n.id}
                              onClick={() => !n.isRead && markOneRead(n.id)}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-0 ${
                                !n.isRead ? 'bg-primary/5' : ''
                              }`}
                            >
                              <div className={`mt-0.5 flex-shrink-0 ${color}`}>
                                <Icon size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                {getTimeAgo(n.createdAt)}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-border hidden sm:block" />

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 sm:pr-2 py-1 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                  {userInitial}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground leading-tight">{currentUser?.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{currentUser?.email}</p>
                </div>
              </button>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-4 border-b border-border flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {userInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{currentUser?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 border-b border-border">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">Role</span>
                      <p className="text-sm font-medium text-foreground">{formatRole(userRole)}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <UserCircle size={16} />
                        <span>View Profile</span>
                      </Link>
                      <form action={handleSignOut}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
