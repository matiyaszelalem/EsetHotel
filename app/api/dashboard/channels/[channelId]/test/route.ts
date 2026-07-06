import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { channelId } = await params
    const channel = await queryOne('SELECT id, name, slug, api_key FROM channel WHERE id = $1', [channelId])
    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

    const success = channel.api_key && channel.api_key.length > 5
    return NextResponse.json({
      success,
      message: success ? `Successfully connected to ${channel.name}` : `Failed to connect to ${channel.name}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
