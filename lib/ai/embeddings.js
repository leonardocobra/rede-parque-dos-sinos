// Fase 3 AI Native Lab — embeddings via Voyage AI
//
// Provider: voyage-3-lite (512 dims, $0.02/1M tokens)
// Sem dep npm nova — fetch nativo do Node 18+ (incluído no Next.js 14).
//
// Unidade semântica: profissional_servicos.
// Texto embeddado: "{servico}: {contexto}" ou "{servico}" se sem contexto.
// Contexto = descrição do serviço; na falta, bio do profissional.

import { descricaoGerada } from "./descricoes-geradas";

export const MODELO_EMBEDDING = "voyage-3-lite";
export const DIMS = 512;

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const BATCH_MAX = 128; // limite do voyage-3-lite por chamada

// Remove emoji/pictogramas e colapsa espaços — emoji vira ruído de token
// e não agrega sinal semântico ("🧶 Artesã de Crochê" -> "Artesã de Crochê").
export function limparTexto(s) {
  return (s || "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Monta o texto-fonte do embedding combinando o nome do serviço com o
// contexto mais rico disponível: descrição do serviço > bio do profissional.
export function textoParaEmbedding(servico, descricao, bio) {
  const nome = limparTexto(servico);
  const contexto = limparTexto(descricao) || limparTexto(bio);
  return contexto ? `${nome}: ${contexto}` : nome;
}

async function chamarVoyage(input) {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY não configurada");

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODELO_EMBEDDING, input }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Voyage API ${res.status}: ${msg}`);
  }
  return res.json();
}

// Gera embedding para um único texto. Retorna float[512].
export async function gerarEmbedding(texto) {
  const json = await chamarVoyage(texto);
  return json.data[0].embedding;
}

// Gera embeddings para um lote de textos (máx. BATCH_MAX por chamada).
// Retorna float[][512].
export async function gerarEmbeddingsBatch(textos) {
  if (textos.length === 0) return [];
  const resultados = [];
  for (let i = 0; i < textos.length; i += BATCH_MAX) {
    const lote = textos.slice(i, i + BATCH_MAX);
    const json = await chamarVoyage(lote);
    resultados.push(...json.data.map((d) => d.embedding));
  }
  return resultados;
}

// Piso de similaridade padrão. voyage-3-lite em PT curto tende a pontuar
// mais baixo que modelos maiores; 0.4 corta lixo sem descartar match real.
export const MIN_SIMILARIDADE_PADRAO = 0.4;

// Busca semântica: query em linguagem natural → top-N serviços mais similares
// acima do piso de similaridade (abaixo dele, retorna vazio — sem lixo).
export async function buscarPorSimilaridade(
  query,
  supabase,
  { limite = 10, categoria = null, minSimilaridade = MIN_SIMILARIDADE_PADRAO } = {}
) {
  const embedding = await gerarEmbedding(query);
  const { data, error } = await supabase.rpc("ai_buscar_servicos", {
    query_embedding: embedding,
    p_limite: limite,
    p_categoria: categoria ?? null,
    p_min_similaridade: minSimilaridade,
  });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Gera (ou regenera) embeddings para todos os serviços de um profissional
// que ainda não têm embedding. Retorna o número de registros atualizados.
export async function gerarEmbeddingsProfissional(supabase, profissionalId) {
  const { data: servicos, error } = await supabase
    .from("profissional_servicos")
    .select("id, servico, descricao, profissionais(descricao)")
    .eq("profissional_id", profissionalId)
    .is("embedding", null);

  if (error) throw new Error(error.message);
  if (!servicos?.length) return 0;

  const textos = servicos.map((s) => textoParaEmbedding(s.servico, contextoServico(s)));
  const embeddings = await gerarEmbeddingsBatch(textos);

  await Promise.all(
    servicos.map((s, i) =>
      supabase.from("profissional_servicos").update({ embedding: embeddings[i] }).eq("id", s.id)
    )
  );

  return servicos.length;
}

// Resolve o contexto mais rico para um serviço, na ordem de prioridade:
// descrição do serviço > bio do profissional > descrição gerada/aprovada.
function contextoServico(s) {
  return s.descricao || s.profissionais?.descricao || descricaoGerada(s.servico);
}

// Backfill: gera embeddings para os serviços.
// Por padrão só processa quem está sem embedding; com { forcar: true }
// reembeda TODOS (necessário quando a fonte do texto muda, ex. passar a
// incluir a bio). Processa em lotes para respeitar o limite do Voyage.
// Retorna { processados, erros }.
export async function backfillEmbeddings(supabase, { forcar = false } = {}) {
  let query = supabase
    .from("profissional_servicos")
    .select("id, servico, descricao, profissionais(descricao)")
    .order("criado_em", { ascending: true });
  if (!forcar) query = query.is("embedding", null);

  const { data: pendentes, error } = await query;

  if (error) throw new Error(error.message);
  if (!pendentes?.length) return { processados: 0, erros: 0 };

  let processados = 0;
  let erros = 0;

  for (let i = 0; i < pendentes.length; i += BATCH_MAX) {
    const lote = pendentes.slice(i, i + BATCH_MAX);
    try {
      const textos = lote.map((s) => textoParaEmbedding(s.servico, contextoServico(s)));
      const embeddings = await gerarEmbeddingsBatch(textos);
      await Promise.all(
        lote.map((s, j) =>
          supabase.from("profissional_servicos").update({ embedding: embeddings[j] }).eq("id", s.id)
        )
      );
      processados += lote.length;
    } catch {
      erros += lote.length;
    }
  }

  return { processados, erros };
}
