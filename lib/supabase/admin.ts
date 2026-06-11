import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // SUPABASE_SECRET_KEY (format sb_secret_) n'est pas un JWT valide pour le client JS.
  // Utilise SUPABASE_SERVICE_ROLE_KEY (JWT eyJ...) si disponible, sinon anon key.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
