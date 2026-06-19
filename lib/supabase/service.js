// Cliente Supabase com a chave `service_role` — USO EXCLUSIVO NO SERVIDOR.
// Ignora RLS, então JAMAIS pode ser importado por código de cliente ("use client").
//
// Duas salvaguardas:
//   1) SUPABASE_SERVICE_ROLE_KEY não tem prefixo NEXT_PUBLIC — o Next nunca a
//      embute no bundle do browser (lá ela seria `undefined`).
//   2) Guarda em runtime: lança se for avaliado num contexto de browser.
//
// Usado pelo /admin para ler a tabela `eventos`, cujo SELECT é fechado a
// anon/authenticated. Ver docs/observabilidade-spec.md.
import { createClient } from "@supabase/supabase-js";

// Retorna o cliente admin, ou null se a chave não estiver configurada
// (permite ao /admin degradar com uma mensagem em vez de quebrar).
export function getServiceSupabase() {
  if (typeof window !== "undefined") {
    throw new Error("getServiceSupabase() não pode ser usado no cliente.");
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
