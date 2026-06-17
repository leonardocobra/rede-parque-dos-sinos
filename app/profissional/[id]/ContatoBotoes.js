"use client";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { WhatsAppIcon, InstagramIcon } from "../../components/SocialIcons";

// CTAs de contato do perfil. Cada clique registra a métrica-norte
// "cliques de contato" (intenção de contato = valor entregue).
export default function ContatoBotoes({ id, nome, whatsapp, instagram }) {
  function registrar(canal) {
    track("contato_click", { canal, id, nome });
  }

  return (
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
  );
}
