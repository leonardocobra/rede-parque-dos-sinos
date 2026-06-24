// GET /api/ai/ping
//
// Smoke-test da integração com a API da Anthropic: faz uma chamada mínima ao
// Claude Haiku, grava uma linha em `ai_invocacoes` (tokens, custo, latência)
// e devolve os metadados ao chamador. Não expõe a API key na resposta.
//
// Serve como foundation check do PR 0 do AI Native Lab e como health-check
// do pipeline servidor → Anthropic → Supabase.
export const runtime = "nodejs";

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServiceSupabase } from "../../../../lib/supabase/service";
import { calcularCusto, gravarInvocacao } from "../../../../lib/ai/log";

const MODELO = "claude-haiku-4-5-20251001";
const ROTA = "/api/ai/ping";

export async function GET() {
  const inicio = Date.now();
  let sucesso = false;
  let erro = null;
  let tokensIn = 0;
  let tokensOut = 0;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: MODELO,
      max_tokens: 10,
      messages: [{ role: "user", content: "ping" }],
    });
    tokensIn = msg.usage?.input_tokens ?? 0;
    tokensOut = msg.usage?.output_tokens ?? 0;
    sucesso = true;
  } catch (err) {
    erro = err.message ?? "erro desconhecido";
  }

  const latenciaMs = Date.now() - inicio;
  const custo = calcularCusto(MODELO, tokensIn, tokensOut);

  const sb = getServiceSupabase();
  await gravarInvocacao(sb, {
    modelo: MODELO,
    tokensIn,
    tokensOut,
    custo,
    latenciaMs,
    sucesso,
    erro,
    rota: ROTA,
  });

  return NextResponse.json({
    ok: sucesso,
    modelo: MODELO,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    latencia_ms: latenciaMs,
    custo,
    erro,
  });
}
