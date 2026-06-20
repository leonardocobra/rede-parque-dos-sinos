"use client";
import { useState } from "react";
import { getBrowserSupabase } from "../../lib/supabase/client";
import { computaScore, CRITERIOS } from "../../lib/score";

const COR_NIVEL = {
  Bronze: { badge: "bg-[#C4873A] text-white", barra: "bg-[#C4873A]" },
  Prata:  { badge: "bg-[#7A94A8] text-white", barra: "bg-[#7A94A8]" },
  Ouro:   { badge: "bg-[#C9A84C] text-white", barra: "bg-[#C9A84C]" },
};

const PROXIMO_NIVEL = { Bronze: "Prata", Prata: "Ouro" };
const LIMIAR_PROXIMO = { Bronze: 40, Prata: 70 };

// Mapeamento: autoKey da lib → coluna do banco
const AUTO_CAMPO = {
  temGoogle:          "tem_google",
  temFotosGoogle:     "tem_fotos_google",
  temOutroDiretorio:  "tem_outro_diretorio",
  instagramAtivo:     "instagram_ativo",
  temFotosTrabalho:   "tem_fotos_trabalho",
  linkNaBio:          "link_na_bio",
  usaWhatsappBusiness:"usa_whatsapp_business",
  fezMetaAds:         "fez_meta_ads",
  fezGoogleAds:       "fez_google_ads",
};

function initAuto(cadastro) {
  return {
    temGoogle:          !!cadastro.tem_google,
    temFotosGoogle:     !!cadastro.tem_fotos_google,
    temOutroDiretorio:  !!cadastro.tem_outro_diretorio,
    instagramAtivo:     !!cadastro.instagram_ativo,
    temFotosTrabalho:   !!cadastro.tem_fotos_trabalho,
    linkNaBio:          !!cadastro.link_na_bio,
    usaWhatsappBusiness:!!cadastro.usa_whatsapp_business,
    fezMetaAds:         !!cadastro.fez_meta_ads,
    fezGoogleAds:       !!cadastro.fez_google_ads,
  };
}

const MAX_PASSOS = 3;

export default function ScoreMaturidade({ cadastro }) {
  const [auto, setAuto] = useState(() => initAuto(cadastro));
  const [salvando, setSalvando] = useState(null);

  const { pontos, nivel, barra, proximosPassos } = computaScore(cadastro, auto);
  const cor = COR_NIVEL[nivel];

  const larguraBarra =
    barra.max === barra.min
      ? 100
      : Math.round(((pontos - barra.min) / (barra.max - barra.min)) * 100);

  const ptsFaltam = LIMIAR_PROXIMO[nivel] ? LIMIAR_PROXIMO[nivel] - pontos : 0;

  async function toggle(autoKey, valor) {
    const campo = AUTO_CAMPO[autoKey];
    setAuto((prev) => ({ ...prev, [autoKey]: valor }));
    setSalvando(autoKey);
    const supabase = getBrowserSupabase();
    await supabase.from("profissionais").update({ [campo]: valor }).eq("id", cadastro.id);
    setSalvando(null);
  }

  const criteriosAuto = CRITERIOS.filter((c) => c.auto);
  const passosPendentes = proximosPassos.slice(0, MAX_PASSOS);

  return (
    <div className="space-y-5">

      {/* Cabeçalho: nível + pontos */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className={`inline-block text-[11px] font-bold px-2 py-[3px] rounded-[4px] uppercase tracking-[0.6px] ${cor.badge}`}>
            {nivel}
          </span>
          <p className="text-[22px] font-display leading-tight mt-1">
            {pontos}{" "}
            <span className="text-[14px] text-brand-grey-light font-sans font-normal">/ 100 pts</span>
          </p>
        </div>
        {nivel !== "Ouro" ? (
          <p className="text-[12px] text-brand-grey-light text-right">
            Faltam <strong className="text-brand-text">{ptsFaltam} pts</strong>
            <br />para {PROXIMO_NIVEL[nivel]}
          </p>
        ) : (
          <p className="text-[12px] text-brand-grey-light text-right">Perfil completo 🎉</p>
        )}
      </div>

      {/* Barra de progresso dentro do nível */}
      <div className="h-[6px] rounded-full bg-brand-surface overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cor.barra}`}
          style={{ width: `${Math.min(larguraBarra, 100)}%` }}
        />
      </div>

      {/* Próximos passos (verificados + auto pendentes, topo 3) */}
      {passosPendentes.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-2">
            Próximos passos
          </p>
          <div className="space-y-2">
            {passosPendentes.map((p) => (
              <div key={p.id} className="bg-brand-surface rounded-lg px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[13px] font-bold text-brand-text">{p.label}</span>
                  <span className="text-[12px] font-bold text-brand-red shrink-0">+{p.pts} pts</span>
                </div>
                <p className="text-[12px] text-brand-grey-light mt-1 leading-relaxed">{p.dica}</p>
              </div>
            ))}
          </div>
          {proximosPassos.length > MAX_PASSOS && (
            <p className="text-[11px] text-brand-grey-light mt-2">
              + {proximosPassos.length - MAX_PASSOS} {proximosPassos.length - MAX_PASSOS > 1 ? "ações" : "ação"} disponíveis
            </p>
          )}
        </div>
      )}

      {/* Checklist auto-declarado */}
      <div>
        <p className="text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-1">
          Presença digital
        </p>
        <p className="text-[12px] text-brand-grey-light mb-3">
          Marque o que você já faz — cada item soma pontos ao seu score.
        </p>
        <div className="space-y-3">
          {criteriosAuto.map((c) => {
            const checked = !!auto[c.autoKey];
            return (
              <label key={c.id} className="flex items-start gap-3 cursor-pointer">
                <div className="mt-[2px] shrink-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={salvando === c.autoKey}
                    onChange={(e) => toggle(c.autoKey, e.target.checked)}
                    className="w-4 h-4 accent-brand-red disabled:opacity-50"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[13px] font-bold ${checked ? "line-through text-brand-grey-light" : "text-brand-text"}`}>
                      {c.label}
                    </span>
                    {!checked && (
                      <span className="text-[11px] font-bold text-brand-red shrink-0">
                        +{c.pts} pts
                      </span>
                    )}
                  </div>
                  <p className={`text-[12px] mt-0.5 leading-relaxed ${checked ? "text-brand-grey-light line-through" : "text-brand-grey-light"}`}>
                    {c.dica}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );
}
