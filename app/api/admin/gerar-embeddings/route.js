import { NextResponse } from "next/server";
import { getServerSupabase } from "../../../../lib/supabase/server";
import { getServiceSupabase } from "../../../../lib/supabase/service";
import { isAdmin } from "../../../../lib/admin";
import { backfillEmbeddings } from "../../../../lib/ai/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/gerar-embeddings
// Gera embeddings para todos os profissional_servicos sem embedding.
// Protegido: sessão válida + allowlist de admin.
export async function POST(request) {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (!isAdmin(user.email)) return NextResponse.json({ erro: "Não autorizado" }, { status: 403 });

  const service = getServiceSupabase();
  if (!service) return NextResponse.json({ erro: "SUPABASE_SERVICE_ROLE_KEY ausente" }, { status: 503 });

  try {
    const resultado = await backfillEmbeddings(service);
    return NextResponse.json(resultado);
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}
