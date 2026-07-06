import type {
  ChannelProvider,
  ConnectionTestResult,
  AvailabilityUpdate,
  RateUpdate,
  IncomingReservation,
  SyncResult,
} from './types'

// ─── Realistic Demo Data ───

const DEMO_GUEST_NAMES = [
  'Sarah Mitchell', 'James O\'Connor', 'Maria Garcia', 'Ahmed Hassan',
  'Li Wei', 'Emma Thompson', 'Carlos Mendez', 'Yuki Tanaka',
  'Olga Petrov', 'David Kim', 'Fatima Al-Rashid', 'Lucas Andersen',
  'Priya Sharma', 'Mohamed Diallo', 'Isabella Rossi', 'John Baker',
]

const DEMO_EMAILS = [
  'sarah.m@email.com', 'james.oc@email.com', 'maria.g@email.com',
  'ahmed.h@email.com', 'li.wei@email.com', 'emma.t@email.com',
  'carlos.m@email.com', 'yuki.t@email.com', 'olga.p@email.com',
  'david.k@email.com', 'fatima.ar@email.com', 'lucas.a@email.com',
  'priya.s@email.com', 'mohamed.d@email.com', 'isabella.r@email.com',
  'john.b@email.com',
]

const SPECIAL_REQUESTS = [
  'Late check-in around 11pm',
  'High floor room preferred',
  'Extra towels please',
  'Quiet room away from elevator',
  'Need baby crib',
  'Celebrating anniversary - any special touches appreciated',
  'Allergic to feather pillows',
  '',
  '',
  '', // empty = no special request (weighted toward none)
]

function randomDelay(min = 200, max = 800): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateExternalId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = prefix + '-'
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ─── Demo Provider ───

/**
 * A simulated OTA provider for demo/sandbox mode.
 * All operations are faked with realistic delays and data.
 * Configurable failure rate for testing error handling.
 */
export class DemoProvider implements ChannelProvider {
  readonly name: string
  readonly slug: string
  private failureRate: number // 0.0 to 1.0

  constructor(name: string, slug: string, failureRate = 0.05) {
    this.name = name
    this.slug = slug
    this.failureRate = failureRate
  }

  private shouldFail(): boolean {
    return Math.random() < this.failureRate
  }

  async testConnection(apiKey?: string, apiSecret?: string): Promise<ConnectionTestResult> {
    const startTime = Date.now()
    await randomDelay(100, 500)
    const latencyMs = Date.now() - startTime

    // If no API keys provided but we're in demo mode, always succeed
    if (!apiKey && !apiSecret) {
      return {
        success: true,
        latencyMs,
        message: `Demo connection to ${this.name} successful`,
        details: 'Running in demo mode — no real API credentials required.',
      }
    }

    // Simulate auth validation
    if (this.shouldFail()) {
      return {
        success: false,
        latencyMs,
        message: `Connection to ${this.name} failed`,
        details: 'Authentication error: Invalid API key or secret. Please verify your credentials.',
      }
    }

    return {
      success: true,
      latencyMs,
      message: `Connected to ${this.name} API successfully`,
      details: `API version: v2.1 | Rate limit: 1000 req/min | Latency: ${latencyMs}ms`,
    }
  }

  async pushAvailability(updates: AvailabilityUpdate[]): Promise<SyncResult> {
    await randomDelay(300, 800)

    if (this.shouldFail()) {
      return {
        action: 'AVAILABILITY_PUSH',
        status: 'FAILED',
        itemCount: 0,
        details: {
          message: `Failed to push availability to ${this.name}`,
          errors: ['API timeout: The remote server did not respond within 30 seconds.'],
        },
      }
    }

    // Simulate partial success occasionally
    const hasPartial = Math.random() < 0.1
    if (hasPartial && updates.length > 1) {
      const successCount = Math.ceil(updates.length * 0.7)
      return {
        action: 'AVAILABILITY_PUSH',
        status: 'PARTIAL',
        itemCount: successCount,
        details: {
          message: `Pushed ${successCount}/${updates.length} availability updates to ${this.name}`,
          warnings: [`${updates.length - successCount} updates failed due to rate limiting. Will retry on next sync.`],
        },
      }
    }

    return {
      action: 'AVAILABILITY_PUSH',
      status: 'SUCCESS',
      itemCount: updates.length,
      details: {
        message: `Successfully pushed ${updates.length} availability updates to ${this.name}`,
      },
    }
  }

  async pushRates(updates: RateUpdate[]): Promise<SyncResult> {
    await randomDelay(200, 600)

    if (this.shouldFail()) {
      return {
        action: 'RATE_PUSH',
        status: 'FAILED',
        itemCount: 0,
        details: {
          message: `Failed to push rates to ${this.name}`,
          errors: ['Rate plan validation error: Currency mismatch detected.'],
        },
      }
    }

    return {
      action: 'RATE_PUSH',
      status: 'SUCCESS',
      itemCount: updates.length,
      details: {
        message: `Successfully pushed ${updates.length} rate updates to ${this.name}`,
      },
    }
  }

  async pullReservations(since?: Date): Promise<{
    result: SyncResult
    reservations: IncomingReservation[]
  }> {
    await randomDelay(400, 1000)

    if (this.shouldFail()) {
      return {
        result: {
          action: 'RESERVATION_PULL',
          status: 'FAILED',
          itemCount: 0,
          details: {
            message: `Failed to pull reservations from ${this.name}`,
            errors: ['API Error 503: Service temporarily unavailable.'],
          },
        },
        reservations: [],
      }
    }

    // Generate 0-3 fake reservations
    const count = Math.floor(Math.random() * 4)
    const reservations: IncomingReservation[] = []

    for (let i = 0; i < count; i++) {
      const checkIn = new Date()
      checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) + 1)
      checkIn.setHours(14, 0, 0, 0)

      const nights = Math.floor(Math.random() * 5) + 1
      const checkOut = new Date(checkIn)
      checkOut.setDate(checkOut.getDate() + nights)
      checkOut.setHours(11, 0, 0, 0)

      const guestIdx = Math.floor(Math.random() * DEMO_GUEST_NAMES.length)

      reservations.push({
        externalId: generateExternalId(this.slug.toUpperCase().replace(/-/g, '')),
        channelSlug: this.slug,
        guestName: DEMO_GUEST_NAMES[guestIdx],
        guestEmail: DEMO_EMAILS[guestIdx],
        guestPhone: `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        checkIn,
        checkOut,
        guests: Math.floor(Math.random() * 3) + 1,
        roomCode: `ROOM-${String.fromCharCode(65 + Math.floor(Math.random() * 4))}`,
        totalPrice: Math.round((nights * (80 + Math.random() * 200)) * 100) / 100,
        currency: 'USD',
        specialRequests: randomItem(SPECIAL_REQUESTS) || undefined,
      })
    }

    return {
      result: {
        action: 'RESERVATION_PULL',
        status: 'SUCCESS',
        itemCount: count,
        details: {
          message: count > 0
            ? `Pulled ${count} new reservation(s) from ${this.name}`
            : `No new reservations from ${this.name}`,
        },
      },
      reservations,
    }
  }
}

// ─── Provider Factory ───

export function createDemoProvider(name: string, slug: string): DemoProvider {
  return new DemoProvider(name, slug)
}
