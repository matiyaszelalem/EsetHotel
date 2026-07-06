// ─── Channel Manager Types ───

export type ChannelStatus = 'DEMO' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'

export type SyncAction = 'AVAILABILITY_PUSH' | 'RATE_PUSH' | 'RESERVATION_PULL' | 'FULL_SYNC'

export type SyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL'

export interface AvailabilityUpdate {
  externalRoomCode: string
  date: string        // ISO date string (YYYY-MM-DD)
  available: number   // Number of rooms available
  restrictions?: {
    minStay?: number
    maxStay?: number
    closedToArrival?: boolean
    closedToDeparture?: boolean
  }
}

export interface RateUpdate {
  externalRoomCode: string
  rateCode?: string
  date: string        // ISO date string (YYYY-MM-DD)
  price: number
  currency: string
}

export interface IncomingReservation {
  externalId: string          // OTA reservation ID
  channelSlug: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  checkIn: Date
  checkOut: Date
  guests: number
  roomCode: string            // External room code
  totalPrice: number
  currency: string
  specialRequests?: string
}

export interface SyncResult {
  action: SyncAction
  status: SyncStatus
  itemCount: number
  details: {
    message: string
    errors?: string[]
    warnings?: string[]
    data?: any
  }
}

export interface ConnectionTestResult {
  success: boolean
  latencyMs: number
  message: string
  details?: string
}

/**
 * Provider interface that all channel integrations must implement.
 * Demo mode and future live integrations (Booking.com, Expedia, etc.)
 * all conform to this interface.
 */
export interface ChannelProvider {
  readonly name: string
  readonly slug: string

  testConnection(apiKey?: string, apiSecret?: string): Promise<ConnectionTestResult>

  pushAvailability(updates: AvailabilityUpdate[]): Promise<SyncResult>

  pushRates(updates: RateUpdate[]): Promise<SyncResult>

  pullReservations(since?: Date): Promise<{
    result: SyncResult
    reservations: IncomingReservation[]
  }>
}
