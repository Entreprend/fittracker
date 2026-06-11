import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const { user_id, weight_kg, date } = await req.json()
    if (!user_id || !weight_kg) {
      return NextResponse.json({ error: 'user_id and weight_kg are required' }, { status: 400 })
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/body_weights`, {
      method: 'POST',
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
      },
      body: JSON.stringify({
        id:          crypto.randomUUID(),
        user_id,
        weight_kg:   parseFloat(weight_kg),
        date: date ?? new Date().toISOString(),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[POST /api/body-weights]', res.status, err)
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const rows = await res.json()
    return NextResponse.json(Array.isArray(rows) ? rows[0] ?? {} : rows)
  } catch (e) {
    console.error('[POST /api/body-weights]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
