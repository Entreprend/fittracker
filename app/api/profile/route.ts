import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Colonnes réelles de la table profiles (tout champ hors liste est rejeté)
const ALLOWED_COLS = [
  'user_id', 'username', 'full_name',
  'weight_kg', 'height_cm', 'age',
  'objective', 'level', 'avatar_url',
] as const

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('profile PATCH body:', JSON.stringify(body))

    // Construire le payload en n'incluant que les colonnes autorisées
    const payload: Record<string, unknown> = {}
    for (const col of ALLOWED_COLS) {
      if (col in body) payload[col] = body[col]
    }

    let url: string
    let method: string
    let prefer: string

    if (body.id) {
      // Mise à jour d'une ligne existante par PK (page profil)
      url    = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${body.id}`
      method = 'PATCH'
      prefer = 'return=minimal'
    } else if (body.user_id) {
      // Upsert par user_id — crée la ligne si elle n'existe pas encore (onboarding)
      url    = `${SUPABASE_URL}/rest/v1/profiles?on_conflict=user_id`
      method = 'POST'
      prefer = 'resolution=merge-duplicates,return=minimal'
    } else {
      return NextResponse.json({ error: 'id or user_id required' }, { status: 400 })
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      method,
      headers: {
        'apikey':        SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        prefer,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timer)

    const resText = await res.text()
    console.log('profile PATCH supabase status:', res.status)
    console.log('profile PATCH supabase response:', resText)

    if (!res.ok) {
      console.error('[PATCH /api/profile]', res.status, resText)
      return NextResponse.json({ error: resText }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[PATCH /api/profile]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
