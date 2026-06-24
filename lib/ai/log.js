// Preços por 1M tokens (USD). Atualizar se a Anthropic mudar a tabela de preços.
const PRECOS = {
  "claude-haiku-4-5-20251001": { entrada: 0.8, saida: 4.0 },
  "claude-haiku-4-5": { entrada: 0.8, saida: 4.0 },
  "claude-sonnet-4-6": { entrada: 3.0, saida: 15.0 },
  "claude-opus-4-8": { entrada: 15.0, saida: 75.0 },
};

const FALLBACK = { entrada: 0.8, saida: 4.0 };

export function calcularCusto(modelo, tokensIn, tokensOut) {
  const preco = PRECOS[modelo] ?? FALLBACK;
  return (tokensIn * preco.entrada + tokensOut * preco.saida) / 1_000_000;
}

export async function gravarInvocacao(supabase, { modelo, tokensIn, tokensOut, custo, latenciaMs, sucesso, erro, rota }) {
  if (!supabase) return;
  await supabase.from("ai_invocacoes").insert({
    modelo,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    custo,
    latencia_ms: latenciaMs,
    sucesso,
    erro: erro ?? null,
    rota,
  });
}
