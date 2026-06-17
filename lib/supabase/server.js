// Cliente Supabase para o servidor (Server Components, Route Handlers, Server
// Actions). Lê e escreve a sessão em cookies, para que a RLS por auth.uid()
// funcione no servidor. Crie um por requisição — não reaproveite entre requests.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function getServerSupabase() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Chamado de um Server Component (cookies read-only). Sem problema:
            // o middleware renova a sessão nas navegações.
          }
        },
      },
    }
  );
}
