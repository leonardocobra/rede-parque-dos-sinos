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
// LLM-as-judge: avalia qualidade de uma descrição profissional via Claude Haiku
// Retorna { score: 1-5, justificativa: string }
// ---------------------------------------------------------------------------

const MODELO_JUIZ = "claude-haiku-4-5-20251001";

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

  const msg = await client.messages.create({
    model: MODELO_JUIZ,
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = msg.content[0]?.text ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Resposta inválida do juiz: ${raw}`);
  return JSON.parse(match[0]);
}
