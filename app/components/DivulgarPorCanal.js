"use client";
import { useState } from "react";
import { track } from "@vercel/analytics";
import { absUrl } from "../../lib/site";
import { adicionarUtm, CANAIS_DIVULGACAO } from "../../lib/utm";

// Gerador de links de divulgação por canal para o profissional (no /painel).
// Cada botão copia o link do perfil já com o utm_source certo, para que a
// origem seja medida corretamente no /admin — mesmo quando o app de origem
// não envia referrer (caso do Instagram). Ver docs/observabilidade-spec.md.
export default function DivulgarPorCanal({ id }) {
  const [copiado, setCopiado] = useState(null);
  const base = absUrl(`/profissional/${id}`);

  async function copiar(canal) {
    const link = adicionarUtm(base, canal.source);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("input");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    track("perfil_share", { canal: canal.source, id });
    setCopiado(canal.id);
    setTimeout(() => setCopiado((c) => (c === canal.id ? null : c)), 2000);
  }

  return (
    <div className="mb-4">
      <h4 className="font-display text-[15px] mb-1">Divulgue seu perfil</h4>
      <p className="text-[12px] text-brand-grey-light mb-2.5">
        Copie o link certo para cada canal — assim a Rede sabe de onde vêm seus clientes.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {CANAIS_DIVULGACAO.map((canal) => (
          <button
            key={canal.id}
            type="button"
            onClick={() => copiar(canal)}
            className="bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-[12px] font-bold text-brand-grey flex items-center justify-between gap-2"
          >
            <span className="truncate">{canal.rotulo}</span>
            <span className="text-[11px] text-brand-red shrink-0">
              {copiado === canal.id ? "copiado ✓" : "copiar"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
