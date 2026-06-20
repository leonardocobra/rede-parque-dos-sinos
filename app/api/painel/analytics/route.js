// GET /api/painel/analytics?profissional_id=<uuid>
//
// Lê eventos do profissional usando service_role (tabela fechada a anon/auth).
// Antes de tocar no service_role, valida via RLS que o profissional pertence
// ao usuário autenticado — se não pertencer, a query retorna vazio e o 403 sai.
import { NextResponse } from "next/server";
import { getServerSupabase } from "../../../../lib/supabase/server";
import { getServiceSupabase } from "../../../../lib/supabase/service";
import { computaAnaliticasPerfil } from "../../../../lib/painelAnalytics";

export const dynamic = "force-dynamic";

const JANELA_DIAS = 30;

export async function GET(request) {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const profissionalId = searchParams.get("profissional_id");
  if (!profissionalId)
    return NextResponse.json({ erro: "profissional_id obrigatório" }, { status: 400 });

  // RLS garante que só retorna se user_id bate — sem necessidade de comparar manualmente.
  const { data: prof } = await supabase
    .from("profissionais")
    .select("id")
    .eq("id", profissionalId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!prof) return NextResponse.json({ erro: "não autorizado" }, { status: 403 });

  const service = getServiceSupabase();
  if (!service)
    return NextResponse.json({ erro: "analytics indisponível" }, { status: 503 });

  const desde = new Date(Date.now() - JANELA_DIAS * 24 * 60 * 60 * 1000).toISOString();
  const { data: eventos, error } = await service
    .from("eventos")
    .select("tipo, origem, canal, criado_em")
    .eq("profissional_id", profissionalId)
    .gte("criado_em", desde)
    .in("tipo", [
      "profile_view",
      "contact_click",
      "share_perfil",
      "share_pos_avaliacao",
      "share_pedir_avaliacao",
    ])
    .order("criado_em", { ascending: true });

  if (error) return NextResponse.json({ erro: "erro ao buscar eventos" }, { status: 500 });

  return NextResponse.json(computaAnaliticasPerfil(eventos || [], { dias: JANELA_DIAS }));
}
