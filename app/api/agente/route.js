import { NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/supabase/server";
import { getServiceSupabase } from "../../../lib/supabase/service";
import { isAdmin } from "../../../lib/admin";
import { agente, MODELO_AGENTE, calcularCusto } from "../../../lib/ai/agente";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  // Barreira 1: sessão válida
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  // Barreira 2: allowlist de admin (mesma lógica do /admin)
  if (!isAdmin(user.email)) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo JSON inválido" }, { status: 400 });
  }

  const pergunta = body?.pergunta?.trim();
  if (!pergunta) return NextResponse.json({ erro: "Pergunta vazia" }, { status: 400 });

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ erro: "Serviço indisponível (SUPABASE_SERVICE_ROLE_KEY ausente)" }, { status: 503 });
  }

  const inicio = Date.now();
  try {
    const { texto, tokensIn, tokensOut } = await agente(pergunta, service);
    const latencia = Date.now() - inicio;

    await service.from("ai_invocacoes").insert({
      modelo: MODELO_AGENTE,
      rota: "/api/agente",
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      custo: calcularCusto(tokensIn, tokensOut),
      latencia_ms: latencia,
      sucesso: true,
    });

    return NextResponse.json({ resposta: texto });
  } catch (err) {
    await service.from("ai_invocacoes").insert({
      modelo: MODELO_AGENTE,
      rota: "/api/agente",
      tokens_in: 0,
      tokens_out: 0,
      custo: 0,
      latencia_ms: Date.now() - inicio,
      sucesso: false,
      erro: err.message,
    });

    return NextResponse.json({ erro: "Erro interno do agente" }, { status: 500 });
  }
}
