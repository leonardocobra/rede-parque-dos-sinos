"use client";
import { useState } from "react";
import { instagramUrl } from "../../../lib/instagram";
import { catIcon } from "../../config";
import { InstagramIcon } from "../../components/SocialIcons";

export default function ServicosInterativos({ servicos }) {
  const [ativoId, setAtivoId] = useState(servicos[0]?.id || null);

  if (!servicos || servicos.length === 0) return null;

  const ativo = servicos.find((s) => s.id === ativoId) || servicos[0];
  const multiplos = servicos.length > 1;
  const igUrl = ativo.instagram ? instagramUrl(ativo.instagram) : null;

  return (
    <div className="mt-1">
      {multiplos ? (
        <div className="flex flex-wrap gap-1.5">
          {servicos.map((s) => (
            <button
              key={s.id}
              onClick={() => setAtivoId(s.id)}
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

      {(ativo.descricao || igUrl) && (
        <div className={`${multiplos ? "mt-2.5 pt-2.5 border-t border-brand-border" : "mt-1.5"}`}>
          {ativo.descricao && (
            <p className="text-[13px] text-brand-grey leading-relaxed">{ativo.descricao}</p>
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
