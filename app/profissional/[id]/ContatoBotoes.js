"use client";
import { useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { WhatsAppIcon, InstagramIcon } from "../../components/SocialIcons";
import { absUrl } from "../../../lib/site";
import { CIDADE } from "../../../lib/perfil";

export default function ContatoBotoes({ id, nome, servico, whatsapp, instagram }) {
  const [copiado, setCopiado] = useState(false);

  function registrar(canal) {
    track("contato_click", { canal, id, nome });
  }

  function compartilharWhatsApp() {
    const url = absUrl(`/profissional/${id}`);
    const texto = `Encontrei na Rede: ${nome} — ${servico} em ${CIDADE}\n${url}`;
    track("perfil_share", { canal: "whatsapp", id });
    window.open(
      `https://wa.me/?text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copiarLink() {
    const url = absUrl(`/profissional/${id}`);
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
    <div>
      <div className="flex gap-2">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contato via WhatsApp"
            onClick={() => registrar("whatsapp")}
            className="bg-[#1DA851] text-white rounded-lg px-5 py-2.5 flex-1 flex items-center justify-center"
          >
            <WhatsAppIcon />
          </a>
        )}
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Perfil no Instagram"
            onClick={() => registrar("instagram")}
            className="bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white rounded-lg px-5 py-2.5 flex-1 flex items-center justify-center"
          >
            <InstagramIcon />
          </a>
        )}
        <Link
          href={"/avaliar?id=" + id + "&nome=" + encodeURIComponent(nome)}
          onClick={() => registrar("avaliar")}
          className="bg-brand-card text-brand-text border-[1.5px] border-brand-border rounded-lg px-5 py-2.5 text-[13px] font-bold flex-1 text-center"
        >
          Avaliar
        </Link>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={compartilharWhatsApp}
          className="bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-[12px] font-bold text-brand-grey flex-1"
        >
          📲 Compartilhar no WhatsApp
        </button>
        <button
          type="button"
          onClick={copiarLink}
          className="bg-brand-surface border border-brand-border rounded-lg px-4 py-2.5 text-[12px] font-bold text-brand-grey flex-1"
        >
          {copiado ? "✓ Copiado!" : "🔗 Copiar link"}
        </button>
      </div>
      <p className="text-[11px] text-brand-grey-light text-center mt-2 tracking-[0.3px]">
        Encontrei na Rede
      </p>
    </div>
  );
}
