import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "./env";

/**
 * Supabase browser client.
 *
 * - Uses ONLY the anon key. Never the service-role key.
 * - Persists the session in localStorage (default behaviour).
 * - Auto-refreshes tokens.
 *
 * All privileged operations (creating users, redeeming scratch cards,
 * verifying PINs) go through Supabase Edge Functions that run with the
 * service-role key server-side.
 */
export const supabase = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Convenience guard — throws if code tries to use Supabase without env set.
 */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  return supabase;
}
