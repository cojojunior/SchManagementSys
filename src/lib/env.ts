/**
 * Environment variable validation.
 * Fails loudly at boot if required vars are missing.
 */

type Env = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appName: string;
  currencySymbol: string;
};

function readEnv(): Env {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const missing: string[] = [];
  if (!url) missing.push("VITE_SUPABASE_URL");
  if (!anonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    const message =
      `Missing Supabase environment variable${missing.length === 1 ? "" : "s"}: ` +
      `${missing.join(", ")}. ` +
      `Copy .env.example to .env.local and fill in your Supabase project credentials.`;
    // Loud warning, but don't crash the app in dev — we still want to render
    // the login page and show the error to the user.
    // eslint-disable-next-line no-console
    console.error("[env] " + message);
  }

  return {
    supabaseUrl: url ?? "",
    supabaseAnonKey: anonKey ?? "",
    appName: (import.meta.env.VITE_APP_NAME as string) ?? "Supreme Academy",
    currencySymbol:
      (import.meta.env.VITE_APP_CURRENCY_SYMBOL as string) ?? "GH₵",
  };
}

export const env = readEnv();

export const isSupabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
