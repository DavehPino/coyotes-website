// Cliente de Supabase SOLO para servidor (clave secreta, ignora RLS).
// Tras enlazar el proyecto, genera los tipos con `npm run db:types` y tipa el cliente:
//   createClient<Database>(...)  con  import type { Database } from '../../shared/database.types.js'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env.js'

let client: SupabaseClient | undefined

export function db(): SupabaseClient {
  client ??= createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return client
}
