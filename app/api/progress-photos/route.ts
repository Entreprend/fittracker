import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, image_url, date } = body

    if (!user_id || !image_url) {
      return NextResponse.json({ error: 'user_id and image_url are required' }, { status: 400 })
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/progress_photos`, {
      method: 'POST',
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
      },
      body: JSON.stringify({
        id:        crypto.randomUUID(),
        user_id,
        image_url,
        date:      date ?? new Date().toISOString().split('T')[0],
      }),
    })

    const text = await res.text()
    if (!res.ok) {
      console.error('[POST /api/progress-photos]', res.status, text)
      return NextResponse.json({ error: text }, { status: 500 })
    }

    const rows = JSON.parse(text)
    return NextResponse.json(Array.isArray(rows) ? rows[0] ?? {} : rows)
  } catch (e) {
    console.error('[POST /api/progress-photos]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
