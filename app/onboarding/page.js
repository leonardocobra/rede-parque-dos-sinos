"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Nav from "../components/features/Nav";
import Footer from "../components/features/Footer";

// ---------------------------------------------------------------------------
// Utilitário: lê um ReadableStream e emite objetos SSE via callback
// ---------------------------------------------------------------------------
async function lerSSE(body, onEvento) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });

      const partes = buffer.split("\n\n");
      buffer = partes.pop() ?? "";

      for (const parte of partes) {
        for (const linha of parte.split("\n")) {
          if (!linha.startsWith("data: ")) continue;
          const payload = linha.slice(6);
          if (payload === "[DONE]") return;
          try {
            onEvento(JSON.parse(payload));
          } catch {
            // linha malformada — ignora
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Componente: card de perfil extraído (mostrado antes do save)
// ---------------------------------------------------------------------------
function CardPerfil({ perfil }) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-[13px] space-y-1.5">
      <p className="font-bold text-brand-text">
        {perfil.nome} · {perfil.telefone}
      </p>
      {perfil.bairro && <p className="text-brand-grey">{perfil.bairro}</p>}
      {perfil.servicos.map((s, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <span className="text-brand-red font-bold shrink-0">·</span>
          <span>
            <span className="font-medium">{s.servico}</span>
            <span className="text-brand-grey-light"> ({s.categoria})</span>
            {s.descricao && <span className="text-brand-grey"> — {s.descricao}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente: card de descrições sugeridas
// ---------------------------------------------------------------------------
function CardDescricoes({ bio, servicos }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4 text-[13px] space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-grey">
        Sugestão de texto
      </p>
      <p className="text-brand-text leading-relaxed">{bio}</p>
      {servicos.map((s, i) => (
        <div key={i} className="pt-1 border-t border-brand-border">
          <p className="font-bold text-brand-text">{s.servico}</p>
          <p className="text-brand-grey leading-relaxed">{s.descricao_sugerida}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bolha de mensagem
// ---------------------------------------------------------------------------
function Bolha({ role, content, streaming }) {
  const cursor = streaming && !content ? (
    <span className="inline-block w-1.5 h-4 bg-brand-grey-light opacity-70 align-middle animate-pulse" />
  ) : null;

  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
          role === "user"
            ? "bg-brand-red text-white rounded-br-none"
            : "bg-brand-card border border-brand-border text-brand-text rounded-bl-none"
        }`}
      >
        {content || cursor}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------
export default function Onboarding() {
  // messages é o que a IA recebe (somente user + assistant de texto)
  const [messages, setMessages] = useState([]);
  // displayItems é o que o chat mostra (inclui cards de perfil/descrição)
  const [displayItems, setDisplayItems] = useState([]);
  const [input, setInput] = useState("");
  const [streamingIdx, setStreamingIdx] = useState(null);
  const [salvo, setSalvo] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayItems]);

  const addDisplay = useCallback((item) => {
    setDisplayItems((prev) => [...prev, item]);
  }, []);

  async function enviar(e) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || streamingIdx !== null) return;

    setInput("");

    const userMsg = { role: "user", content: texto };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    addDisplay({ type: "message", role: "user", content: texto });

    // Reserva slot para a resposta do assistente
    const assistIdx = displayItems.length + 1;
    addDisplay({ type: "message", role: "assistant", content: "" });
    setStreamingIdx(assistIdx);

    let assistText = "";

    try {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        setDisplayItems((prev) => {
          const copy = [...prev];
          copy[assistIdx] = { type: "message", role: "assistant", content: "Ops, erro ao conectar. Tente novamente." };
          return copy;
        });
        return;
      }

      await lerSSE(res.body, (evento) => {
        if (evento.type === "text") {
          assistText += evento.delta;
          setDisplayItems((prev) => {
            const copy = [...prev];
            copy[assistIdx] = { type: "message", role: "assistant", content: assistText };
            return copy;
          });
        } else if (evento.type === "descricao_sugerida") {
          setDisplayItems((prev) => [
            ...prev,
            { type: "descricao_sugerida", bio: evento.bio, servicos: evento.servicos },
          ]);
        } else if (evento.type === "perfil_extraido") {
          setDisplayItems((prev) => [
            ...prev,
            { type: "perfil_extraido", perfil: evento.perfil },
          ]);
        } else if (evento.type === "salvo") {
          setSalvo({ profissional_id: evento.profissional_id });
        } else if (evento.type === "erro") {
          setDisplayItems((prev) => {
            const copy = [...prev];
            copy[assistIdx] = {
              type: "message",
              role: "assistant",
              content: "Ocorreu um erro inesperado. Tente novamente.",
            };
            return copy;
          });
        }
      });

      // Adiciona a resposta final do assistente ao histórico de mensagens
      if (assistText) {
        setMessages((prev) => [...prev, { role: "assistant", content: assistText }]);
      }
    } finally {
      setStreamingIdx(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Tela de sucesso
  // ---------------------------------------------------------------------------
  if (salvo) {
    return (
      <>
        <Nav />
        <div className="px-5 py-10 max-w-[460px] mx-auto text-center">
          <div className="w-14 h-14 rounded-full bg-brand-red-light flex items-center justify-center mx-auto mb-5 text-[28px]">
            ✓
          </div>
          <h2 className="font-display text-[24px] mb-2">Cadastro Realizado!</h2>
          <p className="text-[13px] text-brand-grey mb-7">
            Seu perfil já está visível no catálogo de A Rede.
          </p>
          <Link
            href={`/profissional/${salvo.profissional_id}`}
            className="inline-block bg-brand-red text-white rounded-lg px-7 py-3 text-[14px] font-bold"
          >
            Ver meu perfil →
          </Link>
          <p className="mt-5">
            <Link href="/catalogo" className="text-[13px] text-brand-grey">
              Ver catálogo
            </Link>
          </p>
        </div>
        <Footer />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Tela de chat
  // ---------------------------------------------------------------------------
  return (
    <>
      <Nav />
      <div className="flex flex-col max-w-[600px] mx-auto px-4" style={{ height: "calc(100svh - 110px)" }}>
        {/* Cabeçalho */}
        <div className="py-4 border-b border-brand-border shrink-0">
          <h1 className="font-display text-[20px]">Cadastrar via Chat</h1>
          <p className="text-[12px] text-brand-grey-light mt-0.5">
            Prefere preencher um formulário?{" "}
            <Link href="/cadastro" className="text-brand-red font-bold">
              Usar formulário →
            </Link>
          </p>
        </div>

        {/* Lista de mensagens */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
          {displayItems.length === 0 && (
            <div className="text-center py-8 text-[13px] text-brand-grey-light">
              <p className="font-bold text-brand-text mb-1">Olá! Sou o assistente de cadastro.</p>
              <p>Me conta: qual é o seu nome e o serviço que você oferece?</p>
            </div>
          )}

          {displayItems.map((item, i) => {
            if (item.type === "message") {
              return (
                <Bolha
                  key={i}
                  role={item.role}
                  content={item.content}
                  streaming={streamingIdx === i}
                />
              );
            }
            if (item.type === "descricao_sugerida") {
              return <CardDescricoes key={i} bio={item.bio} servicos={item.servicos} />;
            }
            if (item.type === "perfil_extraido") {
              return <CardPerfil key={i} perfil={item.perfil} />;
            }
            return null;
          })}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={enviar} className="pb-4 pt-2 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={streamingIdx !== null ? "Aguarde..." : "Digite sua mensagem..."}
            disabled={streamingIdx !== null}
            className="flex-1 py-3 px-4 rounded-full border-[1.5px] border-brand-border text-[13px] bg-brand-card outline-none disabled:opacity-50 focus:border-brand-red"
          />
          <button
            type="submit"
            disabled={!input.trim() || streamingIdx !== null}
            className="bg-brand-red text-white rounded-full w-11 h-11 text-lg flex items-center justify-center shrink-0 disabled:bg-brand-border transition-colors"
            aria-label="Enviar"
          >
            ↑
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}
