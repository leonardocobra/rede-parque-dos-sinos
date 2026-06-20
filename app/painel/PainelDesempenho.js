"use client";
import { useEffect, useState } from "react";
import GraficoPerfil from "./GraficoPerfil";

function KPI({ valor, rotulo }) {
  return (
    <div className="bg-brand-surface rounded-lg py-3 px-2 text-center">
      <div className="font-display text-[22px] leading-none text-brand-text">{valor}</div>
      <div className="text-[10px] text-brand-grey-light uppercase tracking-[0.5px] mt-1">
        {rotulo}
      </div>
    </div>
  );
}

function BarraFonte({ origem, total, max }) {
  const pct = max > 0 ? Math.round((total / max) * 100) : 0;
  const ROTULOS = {
    instagram: "Instagram",
    busca: "Busca",
    compartilhado: "Compartilhado",
    direto: "Direto",
  };
  const rotulo = ROTULOS[origem] || origem;

  return (
    <div className="flex items-center gap-2 py-[6px] border-b border-brand-border last:border-0">
      <span className="text-[12px] text-brand-text w-[105px] shrink-0 truncate">{rotulo}</span>
      <div className="flex-1 h-[4px] bg-brand-border rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-text rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-brand-grey-light w-6 text-right shrink-0">{total}</span>
    </div>
  );
}

export default function PainelDesempenho({ profissionalId, onIrParaDivulgar }) {
  const [dados, setDados] = useState(null);
  const [estado, setEstado] = useState("carregando"); // carregando | ok | erro | indisponivel

  useEffect(() => {
    if (!profissionalId) return;
    setEstado("carregando");
    fetch(`/api/painel/analytics?profissional_id=${profissionalId}`)
      .then((r) => {
        if (r.status === 503) { setEstado("indisponivel"); return null; }
        if (!r.ok) { setEstado("erro"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setDados(d);
        setEstado("ok");
      })
      .catch(() => setEstado("erro"));
  }, [profissionalId]);

  if (estado === "carregando") {
    return <p className="text-[13px] text-brand-grey-light py-4">Carregando analytics…</p>;
  }
  if (estado === "indisponivel") {
    return (
      <p className="text-[13px] text-brand-grey-light py-4">
        Analytics indisponível neste ambiente.
      </p>
    );
  }
  if (estado === "erro") {
    return (
      <p className="text-[13px] text-brand-red py-4">
        Não foi possível carregar os dados. Tente novamente.
      </p>
    );
  }

  const { perfilViews, contatos, fontes, serie, referral } = dados;
  const maxFonte = fontes.length > 0 ? fontes[0].total : 1;
  const { shares, sharesPorCanal, visitasIndicacao, contatosIndicacao } = referral || {};
  const temReferral = shares > 0 || visitasIndicacao > 0 || contatosIndicacao > 0;

  const ROTULOS_CANAL = {
    nativo: "Nativo",
    whatsapp: "WhatsApp",
    link_copiado: "Link copiado",
    instagram: "Instagram",
    status: "Status",
    facebook: "Facebook",
    perfil: "Link do painel",
  };

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-brand-grey-light uppercase tracking-[0.6px]">
        Últimos 30 dias
      </p>

      <div className="grid grid-cols-2 gap-2">
        <KPI valor={perfilViews} rotulo="Views de perfil" />
        <KPI valor={contatos} rotulo="Cliques no contato" />
      </div>

      {serie && serie.length > 0 && (
        <div className="bg-brand-surface rounded-lg p-3">
          <p className="text-[11px] text-brand-grey-light mb-2">Tendência diária</p>
          <GraficoPerfil serie={serie} />
          <div className="flex gap-4 mt-2">
            {[
              { cor: "bg-brand-grey", rotulo: "Views de perfil" },
              { cor: "bg-brand-red", rotulo: "Contatos" },
            ].map(({ cor, rotulo }) => (
              <div key={rotulo} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${cor}`} />
                <span className="text-[10px] text-brand-grey-light">{rotulo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {fontes.length > 0 && (
        <div className="bg-brand-surface rounded-lg p-3">
          <p className="text-[11px] text-brand-grey-light uppercase tracking-[0.6px] mb-2">
            De onde vieram as visitas
          </p>
          {fontes.map((f) => (
            <BarraFonte key={f.origem} origem={f.origem} total={f.total} max={maxFonte} />
          ))}
        </div>
      )}

      <div className="bg-brand-surface rounded-lg p-3 space-y-3">
        <p className="text-[11px] text-brand-grey-light uppercase tracking-[0.6px]">
          Indicações
        </p>

        {temReferral ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <KPI valor={shares} rotulo="Compartilhamentos" />
              <KPI valor={visitasIndicacao} rotulo="Visitas via indicação" />
              <KPI valor={contatosIndicacao} rotulo="Contatos via indicação" />
            </div>

            {sharesPorCanal && sharesPorCanal.length > 0 && (
              <div className="pt-1">
                <p className="text-[10px] text-brand-grey-light mb-1.5">Como compartilhou</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {sharesPorCanal.map(({ canal, total }) => (
                    <span key={canal} className="text-[12px] text-brand-text">
                      {ROTULOS_CANAL[canal] ?? canal}{" "}
                      <span className="text-brand-grey-light font-normal">{total}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-[12px] text-brand-grey-light">
            Nenhuma indicação registrada ainda — compartilhe seu perfil para começar a ver aqui.
          </p>
        )}
      </div>

      <button
        onClick={onIrParaDivulgar}
        className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-[13px] font-bold text-brand-text text-left flex items-center justify-between gap-2"
      >
        Divulgue seu perfil
        <span className="text-brand-grey-light">→</span>
      </button>
    </div>
  );
}
