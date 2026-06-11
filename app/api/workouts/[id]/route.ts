import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function sbHeaders(extra?: Record<string, string>) {
  return {
    'apikey':        SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type':  'application/json',
    ...extra,
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/workouts?select=id,name,date,duration_min,total_volume_kg,status,created_at,workout_exercises(id,order_index,exercises(id,name,muscle_group),sets(id,set_number,reps,weight_kg,completed))&id=eq.${id}&user_id=eq.${user.id}&limit=1`,
      {
        headers: {
          'apikey':        SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
        cache: 'no-store',
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)

    if (!res.ok) {
      const err = await res.text()
      console.error('[GET /api/workouts/[id]]', res.status, err)
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const rows = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(rows[0])
  } catch (e) {
    console.error('[GET /api/workouts/[id]]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const fields = await req.json()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/workouts?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: sbHeaders({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify(fields),
        signal: controller.signal,
      },
    )
    clearTimeout(timer)

    if (!res.ok) {
      const err = await res.text()
      console.error('[PATCH /api/workouts/[id]]', res.status, err)
      return NextResponse.json({ error: err }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[PATCH /api/workouts/[id]]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/workouts?id=eq.${id}&user_id=eq.${user.id}`,
      {
        method: 'DELETE',
        headers: sbHeaders(),
        signal: controller.signal,
      },
    )
    clearTimeout(timer)

    if (!res.ok) {
      const err = await res.text()
      console.error('[DELETE /api/workouts/[id]]', res.status, err)
      return NextResponse.json({ error: err }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[DELETE /api/workouts/[id]]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
