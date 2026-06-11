import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

function sbHeaders() {
  return {
    'apikey':        SERVICE_KEY!,
    'Authorization': `Bearer ${SERVICE_KEY!}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  }
}

export async function POST(req: NextRequest) {
  console.log('URL:', SUPABASE_URL?.substring(0, 30))
  console.log('KEY:', SERVICE_KEY?.substring(0, 15))

  try {
    const body = await req.json()
    console.log('BODY:', JSON.stringify({ ...body, exercises: `[${body.exercises?.length ?? 0} items]` }))

    const {
      user_id,
      workout_id,
      name,
      date,
      duration_min = null,
      notes = null,
      status = 'completed',
      exercises = [],
    } = body

    if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 })

    const workoutName = (name ?? '').trim() || 'Séance sans nom'
    const totalVolume = exercises.reduce(
      (sum: number, ex: { sets: { reps: string; weight_kg: string }[] }) =>
        sum + ex.sets.reduce((s2, set) => s2 + (parseFloat(set.reps) || 0) * (parseFloat(set.weight_kg) || 0), 0),
      0,
    )

    let workoutId: string = workout_id ?? ''

    if (!workoutId) {
      workoutId = crypto.randomUUID()
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/workouts`, {
        method:  'POST',
        headers: sbHeaders(),
        body: JSON.stringify({
          id:              workoutId,
          user_id,
          name:            workoutName,
          date,
          duration_min,
          notes,
          status,
          total_volume_kg: totalVolume > 0 ? Math.round(totalVolume) : null,
        }),
      })
      const insertText = await insertRes.text()
      console.log('INSERT STATUS:', insertRes.status)
      console.log('INSERT BODY:', insertText)
      if (!insertRes.ok) return NextResponse.json({ error: insertText }, { status: 500 })
    } else {
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/workouts?id=eq.${workoutId}&user_id=eq.${user_id}`, {
        method:  'PATCH',
        headers: sbHeaders(),
        body: JSON.stringify({
          name: workoutName,
          date,
          duration_min,
          notes,
          status,
          total_volume_kg: totalVolume > 0 ? Math.round(totalVolume) : null,
        }),
      })
      if (!updateRes.ok) {
        const t = await updateRes.text()
        console.log('UPDATE ERROR:', updateRes.status, t)
        return NextResponse.json({ error: t }, { status: 500 })
      }
    }

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]

      const existRes = await fetch(
        `${SUPABASE_URL}/rest/v1/workout_exercises?select=id&workout_id=eq.${workoutId}&exercise_id=eq.${ex.exercise_id}&limit=1`,
        { headers: sbHeaders() },
      )
      const existRows = await existRes.json()
      const existingId: string | undefined = existRows?.[0]?.id

      let weId: string
      if (existingId) {
        weId = existingId
        await fetch(`${SUPABASE_URL}/rest/v1/workout_exercises?id=eq.${weId}`, {
          method:  'PATCH',
          headers: sbHeaders(),
          body:    JSON.stringify({ order_index: i }),
        })
      } else {
        weId = crypto.randomUUID()
        const weRes = await fetch(`${SUPABASE_URL}/rest/v1/workout_exercises`, {
          method:  'POST',
          headers: sbHeaders(),
          body:    JSON.stringify({ id: weId, workout_id: workoutId, exercise_id: ex.exercise_id, order_index: i }),
        })
        if (!weRes.ok) {
          const t = await weRes.text()
          console.log('WE INSERT ERROR:', weRes.status, t)
        }
      }

      await fetch(`${SUPABASE_URL}/rest/v1/sets?workout_exercise_id=eq.${weId}`, {
        method:  'DELETE',
        headers: sbHeaders(),
      })

      for (let j = 0; j < ex.sets.length; j++) {
        const set = ex.sets[j]
        await fetch(`${SUPABASE_URL}/rest/v1/sets`, {
          method:  'POST',
          headers: sbHeaders(),
          body: JSON.stringify({
            id:                  crypto.randomUUID(),
            workout_exercise_id: weId,
            set_number:          j + 1,
            reps:                parseInt(set.reps) || null,
            weight_kg:           parseFloat(set.weight_kg) || null,
            completed:           set.completed ?? false,
          }),
        })
      }
    }

    return NextResponse.json({ workout_id: workoutId })
  } catch (e) {
    console.error('[POST /api/workouts] CATCH:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  console.log('URL:', SUPABASE_URL?.substring(0, 30))
  console.log('KEY:', SERVICE_KEY?.substring(0, 15))

  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 })

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/workouts?select=id,name,date,duration_min,total_volume_kg,status&user_id=eq.${user_id}&order=date.desc,created_at.desc`,
      { headers: sbHeaders() },
    )
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data?.message ?? 'fetch failed' }, { status: 500 })
    return NextResponse.json(data)
  } catch (e) {
    console.error('[GET /api/workouts] CATCH:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
