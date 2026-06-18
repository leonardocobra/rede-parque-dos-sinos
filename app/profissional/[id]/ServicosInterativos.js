"use client";
import { useState } from "react";
import { instagramUrl } from "../../../lib/instagram";
import { catIcon } from "../../config";
import { InstagramIcon } from "../../components/SocialIcons";

// `ativoId`/`onAtivoChange` permitem usar o componente de forma controlada
// (perfil, onde o serviço ativo também governa a seção "Outros"). Sem essas
// props ele mantém o próprio estado — é assim que o catálogo o usa.
//
// `bioFallback` é exibido como descrição quando o serviço ativo não tem
// descrição própria. Usado no catálogo (que não mostra a bio geral em outro
// lugar) para não deixar o card expandido vazio. O perfil não passa essa prop:
// lá a bio já vive na seção "Sobre", então evitamos duplicação.
export default function ServicosInterativos({ servicos, ativoId: ativoIdProp, onAtivoChange, bioFallback }) {
  const [ativoIdState, setAtivoIdState] = useState(servicos[0]?.id || null);
  const controlado = ativoIdProp !== undefined;
  const ativoId = controlado ? ativoIdProp : ativoIdState;

  function selecionar(id) {
    if (!controlado) setAtivoIdState(id);
    onAtivoChange?.(id);
  }

  if (!servicos || servicos.length === 0) return null;

  const ativo = servicos.find((s) => s.id === ativoId) || servicos[0];
  const multiplos = servicos.length > 1;
  const igUrl = ativo.instagram ? instagramUrl(ativo.instagram) : null;
  const descricaoExibida = ativo.descricao || bioFallback || "";

  return (
    <div className="mt-1">
      {multiplos ? (
        <div className="flex flex-wrap gap-1.5">
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => selecionar(s.id)}
              className={`px-2.5 py-[5px] rounded-[6px] text-[13px] font-bold transition-colors duration-150 ${
                s.id === ativoId
                  ? "bg-brand-red text-white"
                  : "bg-brand-surface text-brand-grey border border-brand-border"
              }`}
            >
              {catIcon(s.categoria)} {s.servico}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-[14px] text-brand-red font-bold">
          {catIcon(ativo.categoria)} {ativo.servico}
        </div>
      )}

      {(descricaoExibida || igUrl || ativo.itens?.length > 0) && (
        <div className={`${multiplos ? "mt-2.5 pt-2.5 border-t border-brand-border" : "mt-1.5"}`}>
          {descricaoExibida && (
            <p className="text-[13px] text-brand-grey leading-relaxed">{descricaoExibida}</p>
          )}

          {/* Itens/produtos do serviço — pronto para evoluir o perfil público.
              Renderiza só quando o serviço já tem itens cadastrados. */}
          {ativo.itens?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {ativo.itens.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-brand-text">{item.nome}</span>
                  {item.preco && (
                    <span className="text-brand-grey-light font-bold whitespace-nowrap">
                      {item.preco}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {igUrl && (
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-1.5 text-[12px] font-bold text-brand-grey hover:text-brand-text transition-colors"
            >
              <InstagramIcon size={13} />@{ativo.instagram}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
