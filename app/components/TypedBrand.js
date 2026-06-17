"use client";
import { useEffect, useState } from "react";

// Wordmark "a_rede" digitado estilo terminal: as letras aparecem uma a uma e,
// ao terminar, um ponto final pisca como o cursor de um terminal.
const TEXT = "a_rede";

export default function TypedBrand() {
  const [count, setCount] = useState(0);
  const [reduce, setReduce] = useState(false);

  // Respeita quem prefere menos animação: mostra tudo de uma vez.
  useEffect(() => {
    const r = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (r) {
      setReduce(true);
      setCount(TEXT.length);
    }
  }, []);

  // Digita um caractere por vez.
  useEffect(() => {
    if (reduce || count >= TEXT.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), 150);
    return () => clearTimeout(t);
  }, [count, reduce]);

  const done = count >= TEXT.length;

  return (
    // min-width fixa (em ch, fonte monoespaçada) evita o texto "pular" enquanto digita.
    <span className="inline-block text-left font-mono" style={{ minWidth: "7ch" }}>
      {TEXT.slice(0, count)}
      {done ? <span className="terminal-blink">.</span> : <span className="terminal-blink">▋</span>}
    </span>
  );
}
