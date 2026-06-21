"use client";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { WhatsAppIcon, InstagramIcon } from "../../components/ui/SocialIcons";
import BotoesCompartilhar from "../../components/features/BotoesCompartilhar";
import { registrarEvento } from "../../../lib/eventos";

// Linha de contato do perfil público. Contrato fixo (sempre renderizado,
// nunca atrás de tab/estado — entra como children do PerfilInterativo):
//   - WhatsApp  → CTA primário. Aparece sempre que houver link utilizável
//                 (whatsappLink só é null quando o telefone não tem dígito algum;
//                 nesse caso raro o botão é escondido — não há destino).
//   - Instagram → opcional. Sem handle não há link, então sem botão.
//   - Avaliar   → sempre presente.
// Ordem fixa: WhatsApp → Instagram → Avaliar.
export default function ContatoBotoes({ id, nome, servico, whatsapp, instagram }) {
  function registrar(canal) {
    track("contato_click", { canal, id, nome });
    // Evento na camada própria (conversão consultável por canal).
    registrarEvento("contact_click", { profissional_id: id, canal });
  }

  return (
    <div>
      <div className="flex gap-2">
        {whatsapp && (
          <a
            href={`${whatsapp}?text=${encodeURIComponent(`Oi ${nome}! Vi seu perfil na A Rede e tenho interesse em ${servico}.`)}`}
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
      <div className="mt-2">
        <BotoesCompartilhar id={id} nome={nome} servico={servico} />
      </div>
    </div>
  );
}
