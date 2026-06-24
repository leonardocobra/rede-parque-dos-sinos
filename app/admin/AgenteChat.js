"use client";
import { useState, useRef, useEffect } from "react";

const SUGESTOES = [
  "Quais bairros têm menos profissionais?",
  "Como está a distribuição por categoria?",
  "Quantos perfis estão completos (foto + descrição)?",
];

function Mensagem({ tipo, texto }) {
  const isUser = tipo === "usuario";
  return (
    <div className={`rounded-[10px] border border-brand-border p-3 ${isUser ? "bg-brand-surface" : "bg-brand-card"}`}>
      <span className="block text-[10px] text-brand-grey-light uppercase tracking-[0.6px] mb-1">
        {isUser ? "Você" : "Agente"}
      </span>
      <p className="text-[13px] text-brand-text whitespace-pre-wrap leading-relaxed">{texto}</p>
    </div>
  );
}

export default function AgenteChat() {
  const [pergunta, setPergunta] = useState("");
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historico, carregando]);

  async function enviar(texto) {
    const p = (texto ?? pergunta).trim();
    if (!p || carregando) return;
    setPergunta("");
    setErro(null);
    setHistorico((h) => [...h, { tipo: "usuario", texto: p }]);
    setCarregando(true);

    try {
      const res = await fetch("/api/agente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: p }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.erro ?? "Erro desconhecido");
      setHistorico((h) => [...h, { tipo: "agente", texto: json.resposta }]);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div>
      <p className="text-[13px] text-brand-grey-light mb-4 leading-relaxed">
        Faça perguntas sobre a rede. O agente consulta o banco em tempo real usando funções
        read-only dedicadas — sem SQL livre.
      </p>

      {historico.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGESTOES.map((s) => (
            <button
              key={s}
              onClick={() => enviar(s)}
              disabled={carregando}
              className="text-[12px] text-brand-grey border border-brand-border rounded-full px-3 py-1 hover:border-brand-text hover:text-brand-text transition disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {historico.length > 0 && (
        <div className="space-y-2 mb-4 max-h-[420px] overflow-y-auto">
          {historico.map((m, i) => (
            <Mensagem key={i} tipo={m.tipo} texto={m.texto} />
          ))}
          {carregando && (
            <div className="rounded-[10px] border border-brand-border p-3 bg-brand-card animate-pulse">
              <span className="block text-[10px] text-brand-grey-light uppercase tracking-[0.6px] mb-1">Agente</span>
              <span className="text-[13px] text-brand-grey-light">Consultando banco de dados…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {erro && (
        <p className="text-[12px] text-red-500 mb-3">{erro}</p>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); enviar(); }}
        className="flex gap-2"
      >
        <input
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Ex: Quais bairros têm menos cobertura?"
          disabled={carregando}
          className="flex-1 bg-brand-card border border-brand-border rounded-[10px] px-3 py-2 text-[13px] text-brand-text placeholder:text-brand-grey-light focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={carregando || !pergunta.trim()}
          className="px-4 py-2 bg-brand-primary text-white text-[13px] font-bold rounded-[10px] disabled:opacity-40 hover:brightness-110 transition"
        >
          {carregando ? "…" : "→"}
        </button>
      </form>
    </div>
  );
}
