// Callback do magic link: o Supabase redireciona para cá com um `code` na URL.
// Trocamos o code por uma sessão (cookies) e mandamos o profissional ao painel.
import { NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Só permite redirecionos internos (evita open redirect). `//evil.com` e
  // `/\evil.com` começam com "/" mas o navegador os trata como URL absoluta —
  // por isso são rejeitados explicitamente.
  const nextParam = searchParams.get("next") || "/painel";
  const next =
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//") &&
    !nextParam.startsWith("/\\")
      ? nextParam
      : "/painel";

  if (code) {
    const supabase = getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
