'use client'

import { useEffect, useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Info,
  Download
} from 'lucide-react'

interface OccupancyData {
  date: string
  rate: number
  occupied: number
}

interface RevenueData {
  date: string
  revenue: number
}

export default function ReportsPage() {
  const [data, setData] = useState<{
    occupancyData: OccupancyData[]
    revenueData: RevenueData[]
    totalRooms: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReports = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/reports')
      if (!res.ok) throw new Error('Failed to load reports data')
      const reportData = await res.json()
      setData(reportData)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
    const interval = setInterval(fetchReports, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-muted rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="space-y-3">
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center max-w-md mx-auto mt-12">
        <p className="text-destructive mb-4">{error}</p>
        <button 
          onClick={fetchReports}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/95 transition-all"
        >
          <RefreshCw size={16} />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  const occupancy = data?.occupancyData || []
  const revenue = data?.revenueData || []

  // Calculate high-level stats
  const averageOccupancy = occupancy.length > 0 
    ? Math.round(occupancy.reduce((acc, curr) => acc + curr.rate, 0) / occupancy.length) 
    : 0
  const totalRevenue30Days = revenue.reduce((acc, curr) => acc + curr.revenue, 0)
  const maxRevenue = revenue.length > 0 ? Math.max(...revenue.map(r => r.revenue)) : 100

  const sourceBreakdown = (data as any)?.sourceBreakdown || {}
  const cancellationRate = (data as any)?.cancellationRate || []
  const adr = (data as any)?.adr || 0
  const revpar = (data as any)?.revpar || 0

  // Source breakdown totals
  const sourceTotal = Object.values(sourceBreakdown).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number
  const DIRECT = sourceBreakdown['DIRECT'] || 0
  const OTA = sourceBreakdown['OTA'] || 0
  const WALK_IN = sourceBreakdown['WALK_IN'] || 0

  // Latest cancellation rate
  const latestCancellation = cancellationRate[cancellationRate.length - 1] || { rate: 0, cancelled: 0, total: 0 }
  const prevCancellation = cancellationRate[cancellationRate.length - 2] || { rate: 0 }

  const downloadCSV = () => {
    if (!data) return
    
    let csvContent = 'data:text/csv;charset=utf-8,\n'
    csvContent += 'Date,Occupancy Rate (%),Occupied Rooms,Revenue ($)\n'
    
    // Combine occupancy and revenue
    for (let i = 0; i < occupancy.length; i++) {
      const o = occupancy[i]
      const r = revenue.find(rev => rev.date === o.date)
      csvContent += `${o.date},${o.rate},${o.occupied},${r?.revenue || 0}\n`
    }
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `hotel_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Hotel Reports</h1>
          <p className="text-sm text-muted-foreground">Analyze occupancy trends and revenue streams over the last 30 days.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadCSV}
            disabled={loading || !data}
            className="flex items-center gap-2 px-4 py-2.5 bg-ink text-primary-foreground font-semibold rounded-lg hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            <Download size={16} />
            <span className="text-sm">Export CSV</span>
          </button>
          <button 
            onClick={fetchReports}
            className="p-2.5 bg-background border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ADR (Avg Daily Rate)</span>
            <p className="text-3xl font-extrabold text-foreground">${adr.toFixed(2)}</p>
            <span className="text-xs text-muted-foreground font-medium">Per occupied room / night</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">RevPAR</span>
            <p className="text-3xl font-extrabold text-foreground">${revpar.toFixed(2)}</p>
            <span className="text-xs text-muted-foreground font-medium">Per available room / night</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-info/10 flex items-center justify-center text-info">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cancellation Rate (MTD)</span>
            <p className="text-3xl font-extrabold text-foreground">{latestCancellation.rate}%</p>
            <span className={`text-xs font-medium ${
              latestCancellation.rate <= prevCancellation.rate ? 'text-success' : 'text-destructive'
            }`}>
              {latestCancellation.rate <= prevCancellation.rate ? '↓ Improving' : '↑ Needs attention'} ({latestCancellation.cancelled}/{latestCancellation.total})
            </span>
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
            latestCancellation.rate > 10 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
          }`}>
            <AlertCircle size={20} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Occupancy (30d)</span>
            <p className="text-3xl font-extrabold text-foreground">{averageOccupancy}%</p>
            <span className="text-xs text-primary font-medium">Target is above 75%</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary-light flex items-center justify-center text-primary">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Revenue (30d)</span>
            <p className="text-3xl font-extrabold text-foreground">
              ${totalRevenue30Days.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-success font-medium">Stripe + walk-in payments</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center text-success">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Rooms Monitored</span>
            <p className="text-3xl font-extrabold text-foreground">{data?.totalRooms}</p>
            <span className="text-xs text-muted-foreground font-medium">Active inventory count</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary-light flex items-center justify-center text-primary">
            <BarChart3 size={20} />
          </div>
        </div>
      </div>

      {/* SVG Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Occupancy Rate Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-bold text-foreground text-sm">Daily Occupancy Rate (%)</h3>
            <span className="text-[10px] bg-primary-light text-primary font-semibold px-2 py-0.5 rounded">Last 30 Days</span>
          </div>
          
          <div className="h-64 flex items-end gap-1.5 pt-6 relative border-l border-b border-border px-3">
            {/* Guide lines */}
            <div className="absolute left-0 right-0 top-[25%] border-t border-border border-dashed pointer-events-none"></div>
            <div className="absolute left-0 right-0 top-[50%] border-t border-border border-dashed pointer-events-none"></div>
            <div className="absolute left-0 right-0 top-[75%] border-t border-border border-dashed pointer-events-none"></div>

            {occupancy.map((day, idx) => (
              <div 
                key={idx}
                className="flex-1 bg-primary/90 hover:bg-primary-dark rounded-t transition-all relative group cursor-pointer"
                style={{ height: `${Math.max(4, day.rate)}%` }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-ink text-primary-foreground text-[10px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-20">
                  <p>{day.date}</p>
                  <p className="text-primary-light">{day.rate}% Occupied</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground px-3 font-semibold uppercase">
            <span>{occupancy[0]?.date}</span>
            <span>{occupancy[Math.floor(occupancy.length / 2)]?.date}</span>
            <span>{occupancy[occupancy.length - 1]?.date}</span>
          </div>
        </div>

        {/* Revenue Line Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-bold text-foreground text-sm">Gross Revenue Over Time ($)</h3>
            <span className="text-[10px] bg-success/10 text-success font-semibold px-2 py-0.5 rounded">Last 30 Days</span>
          </div>

          <div className="h-64 flex items-end gap-1.5 pt-6 relative border-l border-b border-border px-3">
            {/* Guide lines */}
            <div className="absolute left-0 right-0 top-[25%] border-t border-border border-dashed pointer-events-none"></div>
            <div className="absolute left-0 right-0 top-[50%] border-t border-border border-dashed pointer-events-none"></div>
            <div className="absolute left-0 right-0 top-[75%] border-t border-border border-dashed pointer-events-none"></div>

            {revenue.map((day, idx) => {
              const heightPercent = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
              return (
                <div 
                  key={idx}
                  className="flex-1 bg-success/90 hover:bg-success/80 rounded-t transition-all relative group cursor-pointer"
                  style={{ height: `${Math.max(4, heightPercent)}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-ink text-primary-foreground text-[10px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-20">
                    <p>{day.date}</p>
                    <p className="text-success">${day.revenue.toFixed(2)}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground px-3 font-semibold uppercase">
            <span>{revenue[0]?.date}</span>
            <span>{revenue[Math.floor(revenue.length / 2)]?.date}</span>
            <span>{revenue[revenue.length - 1]?.date}</span>
          </div>
        </div>

      </div>

      {/* Bottom row: Source Breakdown + Cancellation Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Booking Source Donut Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-bold text-foreground text-sm">Booking Source Breakdown</h3>
            <span className="text-[10px] bg-primary-light text-primary font-semibold px-2 py-0.5 rounded">All Time</span>
          </div>

          <div className="flex items-center gap-8">
            {/* Simple CSS Donut */}
            <div className="relative h-32 w-32 flex-shrink-0">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 36 36">
                {sourceTotal > 0 && (
                  <>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-primary)" strokeWidth="3" 
                      strokeDasharray={`${(DIRECT / sourceTotal) * 100} ${100 - (DIRECT / sourceTotal) * 100}`}
                      strokeLinecap="round" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-success)" strokeWidth="3" 
                      strokeDasharray={`${(OTA / sourceTotal) * 100} ${100 - (OTA / sourceTotal) * 100}`}
                      strokeDashoffset={-((DIRECT / sourceTotal) * 100)}
                      strokeLinecap="round" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-warning)" strokeWidth="3" 
                      strokeDasharray={`${(WALK_IN / sourceTotal) * 100} ${100 - (WALK_IN / sourceTotal) * 100}`}
                      strokeDashoffset={-(((DIRECT + OTA) / sourceTotal) * 100)}
                      strokeLinecap="round" />
                  </>
                )}
                {sourceTotal === 0 && (
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground">{sourceTotal}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 text-sm flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary"></span>
                  <span className="text-muted-foreground">Direct</span>
                </div>
                <span className="font-semibold text-foreground">{DIRECT} ({sourceTotal > 0 ? Math.round((DIRECT / sourceTotal) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-success"></span>
                  <span className="text-muted-foreground">OTA</span>
                </div>
                <span className="font-semibold text-foreground">{OTA} ({sourceTotal > 0 ? Math.round((OTA / sourceTotal) * 100) : 0}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-warning"></span>
                  <span className="text-muted-foreground">Walk-In</span>
                </div>
                <span className="font-semibold text-foreground">{WALK_IN} ({sourceTotal > 0 ? Math.round((WALK_IN / sourceTotal) * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Rate Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-bold text-foreground text-sm">Cancellation Rate (Last 6 Months)</h3>
            <span className="text-[10px] bg-destructive/10 text-destructive font-semibold px-2 py-0.5 rounded">Monthly</span>
          </div>

          {cancellationRate.length > 0 && (
            <div className="h-48 flex items-end gap-4 pt-6 relative border-l border-b border-border px-3">
              <div className="absolute left-0 right-0 top-[33%] border-t border-border border-dashed pointer-events-none"></div>
              <div className="absolute left-0 right-0 top-[66%] border-t border-border border-dashed pointer-events-none"></div>

              {cancellationRate.map((m: any, idx: number) => {
                const maxRate = Math.max(...cancellationRate.map((r: any) => r.rate), 10)
                const heightPercent = (m.rate / maxRate) * 100
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-destructive/80 hover:bg-destructive rounded-t transition-all relative group cursor-pointer"
                      style={{ height: `${Math.max(4, heightPercent)}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-ink text-primary-foreground text-[10px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-20">
                        {m.rate}% ({m.cancelled}/{m.total} bookings)
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-2 font-semibold">{m.month}</span>
                  </div>
                )
              })}
            </div>
          )}
          {cancellationRate.length === 0 && (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No booking data available yet.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
