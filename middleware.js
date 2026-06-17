// Renova a sessão do Supabase a cada navegação e propaga os cookies atualizados.
// Sem isto, o token de acesso expira e a RLS no servidor passa a ver o usuário
// como anônimo. Ver docs/pr-b-auth-ssr-plano.md.
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Dispara o refresh do token quando necessário (efeito colateral intencional).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Roda em todas as rotas, exceto assets estáticos e a imagem OG.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
