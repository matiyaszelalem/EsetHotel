// Default ETB conversion rate (1 USD = 120 ETB)
const DEFAULT_ETB_RATE = 120

let cachedRate: number | null = null
let cacheTime: number | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Format USD amount with ETB equivalent
 */
export function formatDualPrice(
  usdAmount: number,
  etbRate?: number
): { usd: string; etb: string; usdShort: string; etbShort: string } {
  const rate = etbRate ?? DEFAULT_ETB_RATE
  const etbAmount = usdAmount * rate

  return {
    usd: `$${usdAmount.toFixed(2)} USD`,
    etb: `${etbAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`,
    usdShort: `$${usdAmount.toFixed(2)}`,
    etbShort: `${Math.round(etbAmount).toLocaleString()} ETB`,
  }
}

/**
 * Format a compact dual price label e.g. "$150 USD | 18,000 ETB"
 */
export function formatDualPriceCompact(
  usdAmount: number,
  etbRate?: number
): string {
  const p = formatDualPrice(usdAmount, etbRate)
  return `${p.usdShort} | ${p.etbShort}`
}

/**
 * Format just the ETB portion
 */
export function formatETB(usdAmount: number, etbRate?: number): string {
  const rate = etbRate ?? DEFAULT_ETB_RATE
  const etbAmount = usdAmount * rate
  return `${Math.round(etbAmount).toLocaleString()} ETB`
}

/**
 * Fetch the ETB conversion rate from the server (for client components)
 * Falls back to default if fetch fails
 */
export async function fetchEtbRate(): Promise<number> {
  // Check cache first
  if (cachedRate !== null && cacheTime !== null && Date.now() - cacheTime < CACHE_TTL) {
    return cachedRate
  }

  try {
    const res = await fetch('/api/content/settings')
    if (res.ok) {
      const data = await res.json()
      if (data?.etbConversionRate) {
        cachedRate = data.etbConversionRate
        cacheTime = Date.now()
        return cachedRate ?? DEFAULT_ETB_RATE
      }
    }
  } catch {
    // Ignore fetch errors, use default
  }
  return DEFAULT_ETB_RATE
}

/**
 * For server components - fetch the ETB rate directly via database
 * TODO: Implement database query to fetch from hotel settings
 */
export async function getEtbRate(): Promise<number> {
  try {
    // TODO: Fetch ETB conversion rate from database
    return DEFAULT_ETB_RATE
  } catch {
    return DEFAULT_ETB_RATE
  }
}
