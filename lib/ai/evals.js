import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Classificador determinístico: nome do serviço → categoria
// Regras ordenadas do mais para o menos específico.
// Veículos vem antes de Construção para que "Eletricista automotivo" → Veículos
// e "Eletricista" (sem qualificador) → Construção e Reforma.
// ---------------------------------------------------------------------------

const REGRAS = [
  {
    cat: "Veículos",
    palavras: [
      "automotiv", "mecanico", "mecanica", "funileiro", "borracheiro",
      "motorista", "freio", "suspensao", "vidracaria automotiva",
    ],
  },
  {
    cat: "Construção e Reforma",
    palavras: [
      "pedreiro", "eletric", "encanador", "pintor", "azulej",
      "marceneiro", "serralheiro", "gesseiro", "carpinteiro",
      "instalador", "soldador", "armador", "hidraulico",
      "impermeabiliz", "ar-condicionado", "ar condicionado",
      "construtor", "reboco", "drywall", "reforma",
    ],
  },
  {
    cat: "Limpeza e Cuidados",
    palavras: [
      "diarista", "faxin", "cuidador", "zelador", "baba",
      "lavanderia", "passadeira", "limpeza domiciliar", "limpeza residencial",
    ],
  },
  {
    cat: "Tecnologia e Digital",
    palavras: [
      "informatica", "tecnico de computador", "social media", "designer",
      "desenvolvedor", "programador", "webdesigner", "suporte de ti",
    ],
  },
  {
    cat: "Ensino e Educação",
    palavras: ["professor", "aula", "reforco", "tutor", "pedagogia", "educador"],
  },
  {
    cat: "Beleza e Moda",
    palavras: [
      "cabeleireiro", "cabeleleir", "manicure", "pedicure", "costureira",
      "esteticista", "maquiador", "barbeiro", "depilacao", "sobrancelha",
    ],
  },
];

export function inferirCategoria(servico) {
  const txt = servico
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  for (const { cat, palavras } of REGRAS) {
    if (palavras.some((p) => txt.includes(p))) return cat;
  }

  return "Outros Serviços";
}

// ---------------------------------------------------------------------------
// Hierarquia de modelos e limiares de escalonamento
//
// Limiares derivados da literatura de LLM evals:
//   ≥ 80 % — MT-Bench (Zheng et al. 2023, arXiv:2306.05685): taxa mínima de
//             concordância com julgamento humano para um juiz ser confiável.
//   ≥ 60 % — HELM (Liang et al. 2022, arXiv:2211.09110): patamar de
//             competência em escala absoluta; abaixo é considerado "cliff".
//
// O juiz deve sempre ser pelo menos 1 tier acima do gerador para evitar
// o viés de autoavaliação (mesmo modelo avaliando sua própria saída).
// ---------------------------------------------------------------------------

export const LIMIARES = {
  OK: 0.80,     // ≥ 80 % → tier atual adequado
  ALERTA: 0.60, // < 80 %, ≥ 60 % → escalar gerador
                // < 60 % → escalar gerador E juiz
};

export const MODELOS_ESCALA = {
  gerador: [
    "claude-haiku-4-5-20251001", // tier 0 — atual (onboarding)
    "claude-sonnet-4-6",         // tier 1 — escalonamento 1
    "claude-opus-4-8",           // tier 2 — escalonamento máximo
  ],
  juiz: [
    "claude-sonnet-4-6",         // tier 0 — atual (1 acima do gerador Haiku)
    "claude-opus-4-8",           // tier 1 — escalonamento 1
    "claude-opus-4-8",           // tier 2 — topo; avaliar revisão humana complementar
  ],
};

// resultados: array de { qualidade: "boa"|"ruim", score: number, score_minimo?: number }
// Retorna { tier: 0|1|2, taxa: number, acao: string, mensagem: string|null }
export function calcularEscalaTier(resultados) {
  const boas = resultados.filter((r) => r.qualidade === "boa");
  if (boas.length === 0) throw new Error("Nenhum resultado 'boa' para calcular concordância");

  const aprovadas = boas.filter((r) => r.score >= (r.score_minimo ?? 3)).length;
  const taxa = aprovadas / boas.length;

  if (taxa >= LIMIARES.OK) {
    return { tier: 0, taxa, acao: "ok", mensagem: null };
  }

  if (taxa >= LIMIARES.ALERTA) {
    return {
      tier: 1,
      taxa,
      acao: "escalar_gerador",
      mensagem:
        `Taxa de concordância ${(taxa * 100).toFixed(0)}% < 80% (MT-Bench, Zheng et al. 2023) — ` +
        `trocar gerador: ${MODELOS_ESCALA.gerador[0]} → ${MODELOS_ESCALA.gerador[1]}`,
    };
  }

  return {
    tier: 2,
    taxa,
    acao: "escalar_ambos",
    mensagem:
      `Taxa de concordância ${(taxa * 100).toFixed(0)}% < 60% (HELM, Liang et al. 2022) — ` +
      `trocar gerador: ${MODELOS_ESCALA.gerador[0]} → ${MODELOS_ESCALA.gerador[2]}, ` +
      `juiz: ${MODELOS_ESCALA.juiz[0]} → ${MODELOS_ESCALA.juiz[2]}`,
  };
}

// ---------------------------------------------------------------------------
// LLM-as-judge: avalia qualidade de uma descrição profissional via Sonnet
//
// Usa Sonnet (tier 0 do juiz) para julgar saídas do gerador Haiku.
// O juiz é propositalmente mais capaz que o gerador para evitar autoavaliação.
// ---------------------------------------------------------------------------

const MODELO_JUIZ = MODELOS_ESCALA.juiz[0]; // claude-sonnet-4-6

export async function julgarDescricao(texto, { servico, contexto } = {}) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const ctx = contexto || servico || "profissional";
  const prompt = `Avalie a qualidade desta descrição profissional para "${ctx}":

"${texto}"

Critérios de score:
1 = incompreensível, vazio ou apenas o nome do serviço
2 = muito vago, sem informação prática ("sou bom no que faço")
3 = adequado — informa o serviço, cumpre o básico
4 = bom — específico, confiante, menciona experiência ou especialidade
5 = excelente — diferencial claro, tom profissional, convence

Responda SOMENTE com JSON válido, sem texto extra: {"score": <1-5>, "justificativa": "<uma frase>"}`;

  // max_tokens 150 truncava o JSON quando a justificativa era longa (>~80 chars)
  const chamarJuiz = () =>
    client.messages.create({
      model: MODELO_JUIZ,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

  const parsear = (msg) => {
    const raw = msg.content[0]?.text ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Resposta inválida do juiz: ${raw}`);
    return JSON.parse(match[0]);
  };

  const msg = await chamarJuiz();
  try {
    return parsear(msg);
  } catch {
    // JSON malformado ocasional — uma retry resolve na maioria dos casos
    const retry = await chamarJuiz();
    return parsear(retry);
  }
}
