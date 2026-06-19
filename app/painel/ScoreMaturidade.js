"use client";
import { useState } from "react";
import { getBrowserSupabase } from "../../lib/supabase/client";
import { computaScore } from "../../lib/score";

const COR_NIVEL = {
  Bronze: { badge: "bg-[#C4873A] text-white", barra: "bg-[#C4873A]" },
  Prata: { badge: "bg-[#7A94A8] text-white", barra: "bg-[#7A94A8]" },
  Ouro: { badge: "bg-[#C9A84C] text-white", barra: "bg-[#C9A84C]" },
};

const MAX_PASSOS = 3;

export default function ScoreMaturidade({ cadastro, stats }) {
  const [temGoogle, setTemGoogle] = useState(!!cadastro.tem_google);
  const [instagramAtivo, setInstagramAtivo] = useState(!!cadastro.instagram_ativo);
  const [salvando, setSalvando] = useState(null);

  const { pontos, nivel, barra, proximosPassos } = computaScore(
    cadastro,
    stats,
    { temGoogle, instagramAtivo }
  );

  const cor = COR_NIVEL[nivel];
  const larguraBarra =
    barra.max === barra.min
      ? 100
      : Math.round(((pontos - barra.min) / (barra.max - barra.min)) * 100);

  const ptsFaltam =
    nivel !== "Ouro"
      ? { Prata: 40, Ouro: 70 }[nivel === "Bronze" ? "Prata" : "Ouro"] - pontos
      : 0;

  async function toggleAuto(campo, valor, setter) {
    setter(valor);
    setSalvando(campo);
    const supabase = getBrowserSupabase();
    await supabase
      .from("profissionais")
      .update({ [campo]: valor })
      .eq("id", cadastro.id);
    setSalvando(null);
  }

  const passosPendentes = proximosPassos.slice(0, MAX_PASSOS);

  return (
    <div className="space-y-4">
      {/* Cabeçalho: nível + pontos */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span
            className={`inline-block text-[11px] font-bold px-2 py-[3px] rounded-[4px] uppercase tracking-[0.6px] ${cor.badge}`}
          >
            {nivel}
          </span>
          <p className="text-[22px] font-display leading-tight mt-1">
            {pontos}{" "}
            <span className="text-[14px] text-brand-grey-light font-sans font-normal">
              / 100 pts
            </span>
          </p>
        </div>
        {nivel !== "Ouro" && (
          <p className="text-[12px] text-brand-grey-light text-right">
            Faltam <strong className="text-brand-text">{ptsFaltam} pts</strong>
            <br />
            para {nivel === "Bronze" ? "Prata" : "Ouro"}
          </p>
        )}
        {nivel === "Ouro" && (
          <p className="text-[12px] text-brand-grey-light text-right">
            Perfil completo 🎉
          </p>
        )}
      </div>

      {/* Barra de progresso dentro do nível */}
      <div className="h-[6px] rounded-full bg-brand-surface overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cor.barra}`}
          style={{ width: `${Math.min(larguraBarra, 100)}%` }}
        />
      </div>

      {/* Próximos passos */}
      {passosPendentes.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-2">
            Próximos passos
          </p>
          <div className="space-y-2">
            {passosPendentes.map((p) => (
              <div
                key={p.label}
                className="flex items-center justify-between gap-3 bg-brand-surface rounded-lg px-3 py-2.5"
              >
                <span className="text-[13px] text-brand-text">{p.label}</span>
                <span className="text-[12px] font-bold text-brand-red shrink-0">
                  +{p.pts} pts
                </span>
              </div>
            ))}
          </div>
          {proximosPassos.length > MAX_PASSOS && (
            <p className="text-[11px] text-brand-grey-light mt-2">
              + {proximosPassos.length - MAX_PASSOS} ação
              {proximosPassos.length - MAX_PASSOS > 1 ? "ões" : ""} disponíveis
            </p>
          )}
        </div>
      )}

      {/* Checklist auto-declarado */}
      <div>
        <p className="text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-2">
          Presença digital (auto-declarado)
        </p>
        <div className="space-y-2">
          <CheckItem
            label="Tenho perfil no Google Meu Negócio"
            dica="Crie em business.google.com — gratuito e aumenta sua visibilidade local."
            pts={5}
            checked={temGoogle}
            salvando={salvando === "tem_google"}
            onChange={(v) => toggleAuto("tem_google", v, setTemGoogle)}
          />
          <CheckItem
            label="Meu Instagram está ativo (post nos últimos 30 dias)"
            dica="Perfis ativos passam mais credibilidade a quem pesquisa."
            pts={5}
            checked={instagramAtivo}
            salvando={salvando === "instagram_ativo"}
            onChange={(v) => toggleAuto("instagram_ativo", v, setInstagramAtivo)}
          />
        </div>
      </div>
    </div>
  );
}

function CheckItem({ label, dica, pts, checked, salvando, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="mt-[2px] shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={salvando}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-brand-red disabled:opacity-50"
        />
      </div>
      <div className="flex-1 min-w-0">
        <span
          className={`text-[13px] ${
            checked ? "line-through text-brand-grey-light" : "text-brand-text"
          }`}
        >
          {label}
        </span>
        {!checked && (
          <p className="text-[11px] text-brand-grey-light mt-0.5">{dica}</p>
        )}
      </div>
      {!checked && (
        <span className="text-[11px] font-bold text-brand-red shrink-0 mt-[2px]">
          +{pts} pts
        </span>
      )}
      {salvando && (
        <span className="text-[11px] text-brand-grey-light shrink-0">...</span>
      )}
    </label>
  );
}
