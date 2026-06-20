"use client";
import { useState } from "react";
import { track } from "@vercel/analytics";
import { ShareIcon } from "./SocialIcons";
import { absUrl } from "../../lib/site";
import { adicionarUtm } from "../../lib/utm";
import { registrarEvento } from "../../lib/eventos";

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

export default function BotoesCompartilhar({ id, nome }) {
  const [copiado, setCopiado] = useState(false);

  async function indicar() {
    const url = adicionarUtm(absUrl(`/profissional/${id}`), "whatsapp");
    // Mensagem enxuta: o card do preview já mostra nome, serviço, cidade e foto.
    // Aqui vai só a voz pessoal de indicação (+ o nome, caso o preview não
    // renderize no destino) — sem repetir o que o card já diz.
    const mensagem = `Recomendo o trabalho de ${nome}! 👇`;
    track("perfil_share", { canal: "share", id });
    // Registra o canal real do compartilhamento: `nativo` quando o share sheet
    // do SO é usado, `whatsapp` no fallback wa.me. Alimenta a quebra por canal
    // do referral no /admin.
    const usaNativo = typeof navigator !== "undefined" && !!navigator.share;
    registrarEvento("share_perfil", {
      profissional_id: id,
      canal: usaNativo ? "nativo" : "whatsapp",
    });
    if (usaNativo) {
      try {
        await navigator.share({ title: `${nome} · A Rede`, text: mensagem, url });
        return;
      } catch {
        // usuário cancelou ou browser não suporta — fallback para WhatsApp
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${mensagem}\n${url}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copiarLink() {
    const url = absUrl(`/profissional/${id}`);
    // Copiar o link também é intenção de indicação — registra como tal para não
    // perder esse sinal (canal `link_copiado`).
    track("perfil_share", { canal: "link", id });
    registrarEvento("share_perfil", { profissional_id: id, canal: "link_copiado" });
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={indicar}
        className="bg-brand-surface border border-brand-border rounded-lg px-4 py-2 text-[12px] font-bold text-brand-grey flex-1 flex items-center justify-center gap-1.5"
      >
        <ShareIcon />
        Indicar para alguém
      </button>
      <button
        type="button"
        onClick={copiarLink}
        aria-label={copiado ? "Link copiado" : "Copiar link"}
        className="bg-brand-surface border border-brand-border rounded-lg w-10 flex items-center justify-center text-brand-grey shrink-0"
      >
        {copiado ? <CheckIcon /> : <LinkIcon />}
      </button>
    </div>
  );
}
