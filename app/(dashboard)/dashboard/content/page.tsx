import Link from 'next/link'
import { Star, Gift, Edit, Layout } from 'lucide-react'

const contentSections = [
  {
    title: 'Testimonials',
    description: 'Manage guest reviews and testimonials displayed on the landing page.',
    href: '/dashboard/content/testimonials',
    icon: Star,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    title: 'Special Offers',
    description: 'Create and manage promotional offers with promo code linking.',
    href: '/dashboard/content/offers',
    icon: Gift,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  {
    title: 'Hero Section',
    description: 'Edit the hero banner title, subtitle, CTA text, and background image.',
    href: '/dashboard/content/hero',
    icon: Layout,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  },
]

export default function ContentHubPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Content Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all landing page content from one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentSections.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary"
            >
              <div className={`h-12 w-12 rounded-lg ${section.color} flex items-center justify-center mb-4`}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
                {section.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {section.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit size={12} />
                <span>Manage</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
