import Link from "next/link";
import BotoesCompartilhar from "./BotoesCompartilhar";
import { WhatsAppIcon, InstagramIcon } from "../ui/SocialIcons";
import { catIcon } from "../../config";
import { iniciais } from "../../../lib/avatar";
import { instagramUrl } from "../../../lib/instagram";

// Card de profissional usado nas listagens server-rendered (categoria e
// páginas locais serviço×bairro). Linka para o perfil completo e expõe os
// CTAs de contato. Server component.
export default function CardProfissional({ prof }) {
  const p = prof;
  const ini = iniciais(p.nome);
  const wn = (p.telefone || "").replace(/\D/g, "");
  const ig = instagramUrl(p.instagram);
  const servicos = p.profissional_servicos || [];
  const servicoPrimario = servicos[0]?.servico || "";

  return (
    <div className="bg-brand-card rounded-[10px] border border-brand-border overflow-hidden">
      <Link href={`/profissional/${p.id}`} className="p-4 flex gap-3.5 items-start block">
        {p.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.foto_url}
            alt={"Foto de " + p.nome}
            loading="lazy"
            className="w-[46px] h-[46px] rounded-lg object-cover shrink-0 border border-brand-border"
          />
        ) : (
          <div className="w-[46px] h-[46px] rounded-lg bg-brand-surface flex items-center justify-center text-[13px] font-extrabold text-brand-red shrink-0 border border-brand-border">
            {ini}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-[15px] truncate min-w-0">{p.nome}</span>
            {p.verificado && (
              <span
                title="Identidade confirmada pela Rede"
                className="ml-auto shrink-0 bg-brand-black text-white font-bold text-[10px] px-2.5 py-[3px] rounded-[4px] uppercase tracking-[0.6px] inline-flex items-center gap-1"
              >
                ✓ Verificado
              </span>
            )}
          </div>
          <div className="space-y-0.5">
            {servicos.map((sv) => (
              <div key={sv.id} className="text-[13px] text-brand-red font-bold">
                {catIcon(sv.categoria)} {sv.servico}
              </div>
            ))}
          </div>
          <div className="text-xs text-brand-grey-light mt-0.5">
            {p.bairro && "📍 " + p.bairro}
            {p.experiencia ? " · " + p.experiencia : ""}
          </div>
        </div>
        <span className="text-brand-grey-light text-[13px] shrink-0 mt-1">→</span>
      </Link>
      <div className="px-4 pb-4 border-t border-brand-border pt-3">
        <div className="flex gap-2 mb-2">
          {wn && (
            <a
              href={"https://wa.me/55" + wn}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contato via WhatsApp"
              className="bg-[#1DA851] text-white rounded-lg px-5 py-2.5 flex-1 flex items-center justify-center"
            >
              <WhatsAppIcon />
            </a>
          )}
          {ig && (
            <a
              href={ig}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Perfil no Instagram"
              className="bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white rounded-lg px-5 py-2.5 flex-1 flex items-center justify-center"
            >
              <InstagramIcon />
            </a>
          )}
          <Link
            href={`/avaliar?id=${p.id}&nome=${encodeURIComponent(p.nome)}`}
            className="bg-brand-card text-brand-text border-[1.5px] border-brand-border rounded-lg px-5 py-2.5 text-[13px] font-bold flex-1 text-center"
          >
            Avaliar
          </Link>
        </div>
        <BotoesCompartilhar id={p.id} nome={p.nome} servico={servicoPrimario} />
      </div>
    </div>
  );
}
