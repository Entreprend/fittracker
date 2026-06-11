const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Utilise le JWT de session de l'utilisateur — passe les policies RLS
// sans avoir besoin de la service_role key ni du schema cache à jour.
function headers(accessToken: string, extra?: Record<string, string>) {
  return {
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
    ...extra,
  }
}

function readHeaders(accessToken: string) {
  return {
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${accessToken}`,
  }
}

export async function sbInsert(
  table: string,
  row: Record<string, unknown>,
  accessToken: string,
): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: headers(accessToken),
    body:    JSON.stringify(row),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message ?? `sbInsert ${table} ${res.status}`)
  return Array.isArray(json) ? json : [json]
}

export async function sbUpdate(
  table: string,
  row: Record<string, unknown>,
  qs: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method:  'PATCH',
    headers: headers(accessToken),
    body:    JSON.stringify(row),
  })
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json?.message ?? `sbUpdate ${table} ${res.status}`)
  }
}

export async function sbDelete(
  table: string,
  qs: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    method:  'DELETE',
    headers: readHeaders(accessToken),
  })
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json?.message ?? `sbDelete ${table} ${res.status}`)
  }
}

export async function sbSelect(
  table: string,
  qs: string,
  accessToken: string,
): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
    headers: readHeaders(accessToken),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message ?? `sbSelect ${table} ${res.status}`)
  return Array.isArray(json) ? json : [json]
}
