"use client";
import { useState } from "react";
import { track } from "@vercel/analytics";
import { absUrl } from "../../lib/site";
import { adicionarUtm, CANAIS_DIVULGACAO, FONTE_PERFIL } from "../../lib/utm";
import { registrarEvento } from "../../lib/eventos";

// Hub de divulgação do profissional (no /painel). Todo link sai com o utm_source
// certo para que a origem seja medida no /admin — mesmo quando o app de origem
// não envia referrer (caso do Instagram). O botão primário "Copiar meu link"
// tagueia com FONTE_PERFIL, então o copiar padrão nunca sai cru.
// Ver docs/observabilidade-spec.md.
export default function DivulgarPorCanal({ id }) {
  const [copiado, setCopiado] = useState(null);
  const base = absUrl(`/profissional/${id}`);

  async function copiar(idAlvo, source) {
    const link = adicionarUtm(base, source);
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
    track("perfil_share", { canal: source, id });
    // Registra o ato de copiar como share — o UTM do link já fecha o loop de
    // atribuição (origem da sessão do visitante), mas sem este evento o /admin
    // vê contatos por indicação sem ver o share que os originou.
    registrarEvento("share_perfil", { profissional_id: id, canal: source });
    setCopiado(idAlvo);
    setTimeout(() => setCopiado((c) => (c === idAlvo ? null : c)), 2000);
  }

  return (
    <div className="bg-brand-surface rounded-[10px] border border-brand-border p-4 mb-4">
      <h4 className="font-display text-[15px] mb-1">Divulgue seu perfil</h4>
      <p className="text-[12px] text-brand-grey-light mb-3">
        Use estes links ao divulgar — assim a Rede sabe de onde vêm seus clientes.
      </p>

      <button
        type="button"
        onClick={() => copiar("perfil", FONTE_PERFIL)}
        className="w-full bg-brand-red text-white rounded-lg px-3 py-2.5 text-[13px] font-bold"
      >
        {copiado === "perfil" ? "Link copiado ✓" : "Copiar meu link"}
      </button>
      <p className="text-[11px] text-brand-grey-light text-center mt-1 mb-3">
        cole onde quiser — já vem identificado
      </p>

      <p className="text-[11px] text-brand-grey-light mb-2">ou copie o link específico do canal:</p>
      <div className="grid grid-cols-2 gap-2">
        {CANAIS_DIVULGACAO.map((canal) => (
          <button
            key={canal.id}
            type="button"
            onClick={() => copiar(canal.id, canal.source)}
            className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-left flex flex-col"
          >
            <span className="text-[12px] font-bold text-brand-grey truncate">{canal.rotulo}</span>
            <span
              className={`text-[10px] mt-0.5 ${
                copiado === canal.id ? "text-brand-red font-bold" : "text-brand-grey-light"
              }`}
            >
              {copiado === canal.id ? "copiado ✓" : canal.dica}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
