// POST /api/ai/onboarding
//
// Route Handler com streaming + tool-use para o onboarding conversacional.
// Recebe o histórico de mensagens, roda um loop de tool-use com o Claude Haiku
// e emite eventos SSE para o cliente. Persiste via service_role quando
// extrair_perfil é chamado com dados válidos (Zod).
//
// Ferramentas:
//   sugerir_descricao — gera bio + descrições (sem efeito colateral no banco)
//   extrair_perfil    — valida com Zod e persiste em profissionais + profissional_servicos
export const runtime = "nodejs";

import Anthropic from "@anthropic-ai/sdk";
import { getServiceSupabase } from "../../../../lib/supabase/service";
import { calcularCusto, gravarInvocacao } from "../../../../lib/ai/log";
import {
  TOOLS,
  SYSTEM_PROMPT,
  PerfilExtraidoSchema,
  SugestaoDescricaoSchema,
  persistirPerfil,
} from "../../../../lib/ai/onboarding";
import { instagramHandle } from "../../../../lib/instagram";
import { gerarEmbeddingsProfissional } from "../../../../lib/ai/embeddings";

const MODELO = "claude-haiku-4-5-20251001";
const ROTA = "/api/ai/onboarding";
const MAX_TURNS = 12;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const { messages } = body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ erro: "messages obrigatório" }, { status: 400 });
  }

  const inicio = Date.now();
  let totalIn = 0;
  let totalOut = 0;
  let sucesso = false;
  let erroMsg = null;

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        let msgList = messages.slice();
        let turns = 0;

        while (turns++ < MAX_TURNS) {
          const sdkStream = client.messages.stream({
            model: MODELO,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: msgList,
          });

          for await (const event of sdkStream) {
            if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
              send({ type: "text", delta: event.delta.text });
            }
          }

          const msg = await sdkStream.finalMessage();
          totalIn += msg.usage?.input_tokens ?? 0;
          totalOut += msg.usage?.output_tokens ?? 0;

          if (msg.stop_reason === "end_turn") {
            sucesso = true;
            break;
          }

          if (msg.stop_reason !== "tool_use") break;

          msgList.push({ role: "assistant", content: msg.content });

          const toolResults = [];

          for (const block of msg.content) {
            if (block.type !== "tool_use") continue;

            if (block.name === "sugerir_descricao") {
              const parsed = SugestaoDescricaoSchema.safeParse(block.input);
              if (parsed.success) {
                send({ type: "descricao_sugerida", bio: parsed.data.bio, servicos: parsed.data.servicos });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content:
                    "Descrições enviadas ao usuário. Pergunte se quer alterar algo antes de confirmar o cadastro.",
                });
              } else {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: `Dados inválidos: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
                  is_error: true,
                });
              }
              continue;
            }

            if (block.name === "extrair_perfil") {
              // Normaliza handles de Instagram antes da validação Zod
              const raw = { ...block.input };
              if (raw.instagram) raw.instagram = instagramHandle(raw.instagram) ?? raw.instagram;
              if (Array.isArray(raw.servicos)) {
                raw.servicos = raw.servicos.map((s) => ({
                  ...s,
                  instagram: s.instagram
                    ? (instagramHandle(s.instagram) ?? s.instagram)
                    : undefined,
                }));
              }

              const parsed = PerfilExtraidoSchema.safeParse(raw);

              if (!parsed.success) {
                const erros = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: `Dados inválidos — corrija e tente novamente: ${erros}`,
                  is_error: true,
                });
                continue;
              }

              send({ type: "perfil_extraido", perfil: parsed.data });

              try {
                const sb = getServiceSupabase();
                if (!sb) throw new Error("Configuração do banco indisponível");
                const profId = await persistirPerfil(sb, parsed.data);
                sucesso = true;
                send({ type: "salvo", profissional_id: profId });
                // best-effort: gera embeddings sem bloquear o stream
                gerarEmbeddingsProfissional(sb, profId).catch(() => {});
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify({ ok: true, profissional_id: profId }),
                });
              } catch (err) {
                erroMsg = err.message;
                send({ type: "erro_persistencia", mensagem: err.message });
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: `Erro ao salvar: ${err.message}`,
                  is_error: true,
                });
              }
            }
          }

          msgList.push({ role: "user", content: toolResults });
        }
      } catch (err) {
        erroMsg = err.message;
        send({ type: "erro", mensagem: err.message });
      } finally {
        const latenciaMs = Date.now() - inicio;
        const custo = calcularCusto(MODELO, totalIn, totalOut);
        const sb = getServiceSupabase();
        // best-effort: não bloqueia o stream se o log falhar
        gravarInvocacao(sb, {
          modelo: MODELO,
          tokensIn: totalIn,
          tokensOut: totalOut,
          custo,
          latenciaMs,
          sucesso,
          erro: erroMsg,
          rota: ROTA,
        }).catch(() => {});
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
