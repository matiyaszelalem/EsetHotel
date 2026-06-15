import {
  Zap,
  Shield,
  BarChart2,
  Globe,
  Layers,
  Clock,
  Lock,
  Cpu,
  Headphones,
} from 'lucide-react'

const featuresData = [
  {
    title: 'Lightning Fast',
    description: 'Sub-second response times with edge-deployed infrastructure across 200+ global PoPs.',
    icon: Zap,
  },
  {
    title: 'Enterprise Security',
    description: 'SOC 2 Type II compliant with end-to-end encryption and role-based access controls.',
    icon: Shield,
  },
  {
    title: 'Advanced Analytics',
    description: 'Real-time dashboards, custom reports, and actionable insights to drive growth.',
    icon: BarChart2,
  },
  {
    title: 'Global CDN',
    description: 'Content delivered from the nearest edge node for instant load times worldwide.',
    icon: Globe,
  },
  {
    title: 'Composable APIs',
    description: 'RESTful and GraphQL APIs designed for extensibility and seamless integrations.',
    icon: Layers,
  },
  {
    title: '99.99% Uptime',
    description: 'Multi-region failover with automated health checks and zero-downtime deployments.',
    icon: Clock,
  },
  {
    title: 'Access Control',
    description: 'Granular permissions with SSO, MFA, and audit logging out of the box.',
    icon: Lock,
  },
  {
    title: 'AI-Powered',
    description: 'Built-in machine learning models for content recommendations and anomaly detection.',
    icon: Cpu,
  },
  {
    title: '24/7 Support',
    description: 'Dedicated account managers and priority support for enterprise customers.',
    icon: Headphones,
  },
]

export function Features() {
  return (
    <section id="features" className="w-full bg-background px-6 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Section Header */}
        <div className="section-header mb-16 flex flex-col items-center text-center">
          <span className="section-heading-eyebrow">
            FEATURES
          </span>
          <h2 className="section-heading-display">
            Everything you need to{' '}
            <br className="hidden sm:block" />
            <span className="text-primary">build & scale.</span>
          </h2>
          <p className="mt-4 max-w-[480px] font-sans text-[15px] leading-[1.8] text-muted-foreground">
            A complete toolkit for modern teams — from development to deployment and beyond.
          </p>
        </div>

        {/* Features Grid */}
        <div className="animate-cards grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuresData.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="card card-base group p-6"
              >
                {/* Icon container */}
                <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-primary/[0.08] transition-colors group-hover:bg-primary/[0.14]">
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                    className="text-primary"
                  />
                </div>
                <h3 className="mt-4 font-heading text-[15px] font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 font-sans text-[13px] leading-[1.7] text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
