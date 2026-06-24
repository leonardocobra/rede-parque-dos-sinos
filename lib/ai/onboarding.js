import { z } from "zod";

// Mantido em sync com app/config.js CATS.value
export const CATS_ENUM = [
  "Construção e Reforma",
  "Limpeza e Cuidados",
  "Tecnologia e Digital",
  "Ensino e Educação",
  "Beleza e Moda",
  "Veículos",
  "Outros Serviços",
];

// ---------------------------------------------------------------------------
// Schemas Zod — validados ANTES de qualquer escrita no banco
// ---------------------------------------------------------------------------

export const ServicoSchema = z.object({
  servico: z.string().min(2, "Nome do serviço muito curto").max(100).trim(),
  categoria: z.enum(CATS_ENUM, { message: "Categoria inválida" }),
  descricao: z
    .string()
    .max(600)
    .nullish()
    .transform((v) => v?.trim() || null),
  instagram: z
    .string()
    .max(50)
    .nullish()
    .transform((v) => v?.trim() || null),
});

export const PerfilExtraidoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto").max(100).trim(),
  telefone: z.string().min(8, "Telefone muito curto").max(20).trim(),
  bairro: z
    .string()
    .max(100)
    .nullish()
    .transform((v) => v?.trim() || null),
  regioes: z
    .string()
    .max(200)
    .nullish()
    .transform((v) => v?.trim() || null),
  instagram: z
    .string()
    .max(50)
    .nullish()
    .transform((v) => v?.trim() || null),
  experiencia: z
    .string()
    .max(100)
    .nullish()
    .transform((v) => v?.trim() || null),
  descricao: z
    .string()
    .max(600)
    .nullish()
    .transform((v) => v?.trim() || null),
  servicos: z.array(ServicoSchema).min(1, "Pelo menos 1 serviço").max(3, "Máximo 3 serviços"),
});

export const SugestaoDescricaoSchema = z.object({
  bio: z.string().min(1).max(600).trim(),
  servicos: z
    .array(
      z.object({
        servico: z.string().min(1),
        descricao_sugerida: z.string().min(1).max(600),
      })
    )
    .min(1)
    .max(3),
});

// ---------------------------------------------------------------------------
// Definição das ferramentas para o SDK da Anthropic
// ---------------------------------------------------------------------------

export const TOOLS = [
  {
    name: "sugerir_descricao",
    description:
      "Gera uma bio e mini-descrições para os serviços do profissional, para mostrar ao usuário antes de confirmar o cadastro. Chame quando tiver nome, serviços e contexto suficiente.",
    input_schema: {
      type: "object",
      properties: {
        bio: {
          type: "string",
          description: "Apresentação geral do profissional (2-3 frases, tom direto e confiante)",
        },
        servicos: {
          type: "array",
          description: "Uma entrada por serviço",
          items: {
            type: "object",
            properties: {
              servico: { type: "string", description: "Nome do serviço" },
              descricao_sugerida: {
                type: "string",
                description: "Descrição do serviço (1-2 frases, destaca diferencial)",
              },
            },
            required: ["servico", "descricao_sugerida"],
          },
          minItems: 1,
          maxItems: 3,
        },
      },
      required: ["bio", "servicos"],
    },
  },
  {
    name: "extrair_perfil",
    description:
      "Cadastra o profissional com os dados coletados. Só chame depois que o usuário confirmar explicitamente que os dados estão corretos. Esta ferramenta escreve no banco de dados.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome completo" },
        telefone: { type: "string", description: "Telefone/WhatsApp com DDD" },
        bairro: { type: "string", description: "Bairro principal (opcional)" },
        regioes: { type: "string", description: "Regiões que atende (opcional)" },
        instagram: { type: "string", description: "Handle Instagram geral, sem @ (opcional)" },
        experiencia: { type: "string", description: "Tempo de experiência, ex: 5 anos (opcional)" },
        descricao: {
          type: "string",
          description: "Apresentação geral — use a bio de sugerir_descricao se já foi gerada (opcional)",
        },
        servicos: {
          type: "array",
          description: "Lista de 1 a 3 serviços",
          items: {
            type: "object",
            properties: {
              servico: { type: "string", description: "Nome do serviço, ex: Eletricista" },
              categoria: {
                type: "string",
                enum: CATS_ENUM,
                description: "Categoria do serviço",
              },
              descricao: {
                type: "string",
                description: "Descrição do serviço — use descricao_sugerida se já foi gerada (opcional)",
              },
              instagram: {
                type: "string",
                description: "Handle Instagram específico deste serviço, sem @ (opcional)",
              },
            },
            required: ["servico", "categoria"],
          },
          minItems: 1,
          maxItems: 3,
        },
      },
      required: ["nome", "telefone", "servicos"],
    },
  },
];

// ---------------------------------------------------------------------------
// System prompt do onboarding
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = `Você é o assistente de cadastro de A Rede — uma plataforma comunitária gratuita de profissionais do bairro Parque dos Sinos em Jacareí/SP.

Seu objetivo: ajudar o profissional a se cadastrar de forma rápida e natural.

**Dados obrigatórios:**
- Nome completo
- Telefone/WhatsApp com DDD
- Pelo menos 1 serviço com categoria

**Dados opcionais (pergunte se o contexto ajudar):**
- Bairro e regiões que atende
- Instagram (geral ou por serviço)
- Tempo de experiência
- Breve apresentação pessoal

**Categorias disponíveis:** Construção e Reforma, Limpeza e Cuidados, Tecnologia e Digital, Ensino e Educação, Beleza e Moda, Veículos, Outros Serviços.

**Fluxo esperado:**
1. Colete nome, telefone e serviço(s).
2. Quando tiver os dados obrigatórios e contexto suficiente, chame \`sugerir_descricao\` para gerar uma bio e descrições. Apresente ao usuário de forma amigável.
3. Pergunte se quer alterar algo.
4. Quando o usuário confirmar ("pode salvar", "confirmo", "tá certo", etc.), chame \`extrair_perfil\` para cadastrar. Esta ferramenta escreve no banco — só chame após confirmação explícita.
5. Se \`extrair_perfil\` retornar erro, informe o que está faltando e corrija.

**Regras de comunicação:**
- Máximo 2-3 perguntas por mensagem.
- Tom amigável, direto, em português.
- Não mencione tecnologia, IA ou "ferramenta" — você é apenas o assistente de cadastro.`;

// ---------------------------------------------------------------------------
// Persistência: grava profissional + serviços com service_role
// ---------------------------------------------------------------------------

export async function persistirPerfil(supabase, perfil) {
  const { data, error } = await supabase
    .from("profissionais")
    .insert({
      nome: perfil.nome,
      telefone: perfil.telefone,
      bairro: perfil.bairro ?? null,
      regioes: perfil.regioes ?? null,
      instagram: perfil.instagram ?? null,
      experiencia: perfil.experiencia ?? null,
      descricao: perfil.descricao ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const profId = data.id;

  if (perfil.servicos.length > 0) {
    const { error: errServicos } = await supabase.from("profissional_servicos").insert(
      perfil.servicos.map((s, idx) => ({
        profissional_id: profId,
        servico: s.servico,
        categoria: s.categoria,
        ordem: idx,
        descricao: s.descricao ?? null,
        instagram: s.instagram ?? null,
      }))
    );
    if (errServicos) throw new Error(errServicos.message);
  }

  return profId;
}
