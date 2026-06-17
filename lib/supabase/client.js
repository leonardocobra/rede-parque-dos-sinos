// Cliente Supabase para o browser (components "use client": login, painel).
// Compartilha a sessão em cookies com o servidor via @supabase/ssr.
import { createBrowserClient } from "@supabase/ssr";

export function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
