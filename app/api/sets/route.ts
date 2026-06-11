import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function sbHeaders() {
  return {
    'apikey':        SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, workout_exercise_id, set_number, reps, weight_kg, completed } = body

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sets`, {
      method: 'POST',
      headers: sbHeaders(),
      body: JSON.stringify({
        id:                  id ?? crypto.randomUUID(),
        workout_exercise_id,
        set_number,
        reps:                reps ?? null,
        weight_kg:           weight_kg ?? null,
        completed:           completed ?? false,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const err = await res.text()
      console.error('[POST /api/sets]', res.status, err)
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const rows = await res.json()
    return NextResponse.json(Array.isArray(rows) ? (rows[0] ?? {}) : rows)
  } catch (e) {
    console.error('[POST /api/sets]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...fields } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sets?id=eq.${id}`, {
      method: 'PATCH',
      headers: sbHeaders(),
      body: JSON.stringify(fields),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const err = await res.text()
      console.error('[PATCH /api/sets]', res.status, err)
      return NextResponse.json({ error: err }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[PATCH /api/sets]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
