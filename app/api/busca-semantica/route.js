import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../lib/supabase/service";
import { buscarPorSimilaridade } from "../../../lib/ai/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/busca-semantica?q=eletricista+Igrejinha&limite=10&categoria=Construção+e+Reforma
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ erro: "Parâmetro 'q' obrigatório" }, { status: 400 });

  const limite = Math.min(parseInt(searchParams.get("limite") ?? "10", 10) || 10, 20);
  const categoria = searchParams.get("categoria") || null;

  const service = getServiceSupabase();
  if (!service) return NextResponse.json({ erro: "Serviço indisponível" }, { status: 503 });

  try {
    const resultados = await buscarPorSimilaridade(query, service, { limite, categoria });
    return NextResponse.json({ resultados });
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 });
  }
}
