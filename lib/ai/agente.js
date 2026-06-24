import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Fase 2 AI Native Lab — Agente sobre Postgres
//
// Princípios de segurança (spec):
//   • O agente nunca recebe SQL livre — usa tool-use com funções parametrizadas.
//   • As funções no Postgres rodam sob o role ai_readonly (só SELECT).
//   • O servidor é o único ponto de contato com o LLM e o banco.
// ---------------------------------------------------------------------------

export const MODELO_AGENTE = "claude-haiku-4-5-20251001";

// Preços em USD/token (Haiku 4.5)
const CUSTO_POR_TOKEN = { in: 0.80 / 1_000_000, out: 4.00 / 1_000_000 };

export function calcularCusto(tokensIn, tokensOut) {
  return tokensIn * CUSTO_POR_TOKEN.in + tokensOut * CUSTO_POR_TOKEN.out;
}

// ---------------------------------------------------------------------------
// Definições de tools para o SDK Anthropic
// ---------------------------------------------------------------------------

export const TOOLS = [
  {
    name: "contar_por_categoria",
    description:
      "Conta quantos profissionais estão cadastrados por categoria de serviço. " +
      "Use para responder 'quantos X temos?', 'qual categoria tem mais profissionais?' ou " +
      "'qual é a distribuição por área de serviço?'.",
    input_schema: {
      type: "object",
      properties: {
        categoria: {
          type: "string",
          description:
            "Filtra por uma categoria específica (ex: 'Construção e Reforma'). " +
            "Se omitido, retorna todas as categorias.",
        },
      },
      required: [],
    },
  },
  {
    name: "bairros_com_menos_oferta",
    description:
      "Lista os bairros com menos profissionais cadastrados, do menos para o mais coberto. " +
      "Use para identificar lacunas geográficas na rede.",
    input_schema: {
      type: "object",
      properties: {
        limite: {
          type: "number",
          description: "Número máximo de bairros a retornar. Padrão: 10.",
        },
      },
      required: [],
    },
  },
  {
    name: "perfis_completos",
    description:
      "Retorna profissionais com perfil completo — foto e descrição preenchidas. " +
      "Use para entender a qualidade dos cadastros ou listar os profissionais mais bem preparados.",
    input_schema: {
      type: "object",
      properties: {
        limite: {
          type: "number",
          description: "Número máximo de perfis a retornar. Padrão: 20.",
        },
      },
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Executor de tools — chama as funções Postgres via supabase.rpc()
// ---------------------------------------------------------------------------

export async function executarTool(nome, args, supabase) {
  switch (nome) {
    case "contar_por_categoria": {
      const { data, error } = await supabase.rpc("ai_contar_por_categoria", {
        p_categoria: args.categoria ?? null,
      });
      if (error) throw new Error(error.message);
      return data;
    }
    case "bairros_com_menos_oferta": {
      const { data, error } = await supabase.rpc("ai_bairros_com_menos_oferta", {
        p_limite: args.limite ?? 10,
      });
      if (error) throw new Error(error.message);
      return data;
    }
    case "perfis_completos": {
      const { data, error } = await supabase.rpc("ai_perfis_completos", {
        p_limite: args.limite ?? 20,
      });
      if (error) throw new Error(error.message);
      return data;
    }
    default:
      throw new Error(`Tool desconhecida: ${nome}`);
  }
}

// ---------------------------------------------------------------------------
// Loop do agente — tool-use nativo do SDK, até MAX_ITER iterações
// ---------------------------------------------------------------------------

const SISTEMA =
  "Você é um assistente de análise para A Rede Parque dos Sinos, uma rede comunitária de " +
  "profissionais autônomos. Responda em português, de forma concisa e útil para o " +
  "administrador. Use as tools disponíveis para buscar dados reais antes de responder. " +
  "Nunca invente números — se os dados não estiverem disponíveis, diga isso.";

const MAX_ITER = 6;

export async function agente(pergunta, supabase) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const mensagens = [{ role: "user", content: pergunta }];

  let totalIn = 0;
  let totalOut = 0;

  for (let i = 0; i < MAX_ITER; i++) {
    const resp = await client.messages.create({
      model: MODELO_AGENTE,
      max_tokens: 1024,
      system: SISTEMA,
      tools: TOOLS,
      messages: mensagens,
    });

    totalIn  += resp.usage.input_tokens;
    totalOut += resp.usage.output_tokens;

    if (resp.stop_reason === "end_turn") {
      const texto = resp.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");
      return { texto, tokensIn: totalIn, tokensOut: totalOut };
    }

    if (resp.stop_reason === "tool_use") {
      mensagens.push({ role: "assistant", content: resp.content });

      const resultados = await Promise.all(
        resp.content
          .filter((b) => b.type === "tool_use")
          .map(async (b) => {
            try {
              const resultado = await executarTool(b.name, b.input, supabase);
              return {
                type: "tool_result",
                tool_use_id: b.id,
                content: JSON.stringify(resultado),
              };
            } catch (err) {
              return {
                type: "tool_result",
                tool_use_id: b.id,
                content: `Erro ao executar ${b.name}: ${err.message}`,
                is_error: true,
              };
            }
          })
      );

      mensagens.push({ role: "user", content: resultados });
      continue;
    }

    // stop_reason inesperado (max_tokens, etc.)
    break;
  }

  throw new Error("Agente excedeu limite de iterações sem resposta final.");
}
