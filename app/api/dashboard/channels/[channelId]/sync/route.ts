import { channelManager } from '@/lib/channel-manager/manager'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const result = await channelManager.fullSync(channelId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error syncing channel:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}
