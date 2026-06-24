"use client";
import { useState } from "react";
import SairButton from "../painel/SairButton";
import Pilulas from "../components/ui/Pilulas";
import GraficoTendencia from "./GraficoTendencia";
import AgenteChat from "./AgenteChat";

// Shell do /admin: navegação por pílulas (Oferta / Tráfego / Desempenho),
// espelhando o padrão do /painel. Recebe as agregações já computadas no
// servidor (v = visão da oferta, a = analytics de eventos) — tudo serializável.

const SECOES = [
  { id: "oferta", label: "Oferta" },
  { id: "trafego", label: "Tráfego" },
  { id: "desempenho", label: "Desempenho" },
  { id: "agente", label: "Agente" },
];

function Stat({ valor, rotulo, sub }) {
  return (
    <div className="bg-brand-card rounded-[10px] border border-brand-border p-4">
      <div className="font-display text-[28px] leading-none text-brand-text">{valor}</div>
      <div className="text-[11px] text-brand-grey-light uppercase tracking-[0.6px] mt-1.5">
        {rotulo}
      </div>
      {sub && <div className="text-[12px] text-brand-grey mt-1">{sub}</div>}
    </div>
  );
}

function Maturidade({ s }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5">
        {s.distribuicao.map((d) => (
          <div key={d.nome} className="bg-brand-card rounded-[10px] border border-brand-border p-3 text-center">
            <span className={`inline-block text-[10px] font-bold px-1.5 py-[2px] rounded-[3px] uppercase tracking-[0.5px] mb-2 ${d.corBadge}`}>
              {d.nome}
            </span>
            <div className="font-display text-[24px] leading-none text-brand-text">{d.total}</div>
            <div className="text-[11px] text-brand-grey-light mt-1">{d.pct}%</div>
          </div>
        ))}
      </div>
      <div className="bg-brand-card rounded-[10px] border border-brand-border px-4 py-3 mt-2.5 flex items-center justify-between">
        <span className="text-[13px] text-brand-grey-light">Média do score</span>
        <span className="font-display text-[20px] text-brand-text">{s.media} <span className="text-[12px] font-sans text-brand-grey-light">/ 100</span></span>
      </div>
    </>
  );
}

function Oferta({ v, s }) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <Stat valor={v.total} rotulo="Profissionais" />
        <Stat
          valor={v.comConta}
          rotulo="Com conta"
          sub={`${v.anonimos} anônimo${v.anonimos === 1 ? "" : "s"}`}
        />
        <Stat valor={`${v.pctComFoto}%`} rotulo="Com foto" sub={`${v.comFoto} de ${v.total}`} />
        <Stat valor={v.verificados} rotulo="Verificados" />
        <Stat valor={v.novos30} rotulo="Novos (30d)" />
        <Stat valor={v.novos90} rotulo="Novos (90d)" />
      </div>

      <h3 className="font-display text-[14px] mt-6 mb-2">Maturidade digital</h3>
      <Maturidade s={s} />

      <h3 className="font-display text-[14px] mt-6 mb-2">Adoção de itens</h3>
      <div className="grid grid-cols-2 gap-2.5">
        <Stat valor={`${v.pctComItem}%`} rotulo="Com ≥1 item" sub={`${v.comItem} de ${v.total}`} />
        <Stat
          valor={`${v.pctComItemFoto}%`}
          rotulo="Com item c/ foto"
          sub={`${v.comItemFoto} de ${v.total}`}
        />
      </div>

      <h3 className="font-display text-[14px] mt-6 mb-2">Cadastros por categoria</h3>
      {v.porCategoria.length === 0 ? (
        <p className="text-[13px] text-brand-grey-light">Nenhum serviço cadastrado ainda.</p>
      ) : (
        <div className="bg-brand-card rounded-[10px] border border-brand-border divide-y divide-brand-border">
          {v.porCategoria.map((c) => (
            <div key={c.categoria} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[13px] text-brand-text">{c.categoria}</span>
              <span className="text-[13px] font-bold text-brand-grey">{c.total}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function LegendaItem({ cor, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-brand-grey">
      <span className="w-3.5 h-[2px] rounded-full" style={{ backgroundColor: cor }} />
      {children}
    </span>
  );
}

// Rótulo amigável dos tipos/canais de indicação.
const ROTULO_CANAL_SHARE = {
  // canais do botão "Indicar" (BotoesCompartilhar)
  nativo: "Share nativo (SO)",
  whatsapp: "WhatsApp (fallback)",
  link_copiado: "Link copiado (perfil)",
  // canais UTM do gerador de links do /painel (DivulgarPorCanal)
  instagram: "Instagram (bio/post)",
  status: "Status / Stories",
  facebook: "Facebook",
  perfil: "Link genérico (painel)",
  "(desconhecido)": "Não identificado",
};

// Bloco de referral — a métrica-norte. Desenhado para ser honesto com N baixo:
// números absolutos, sem taxas de conversão enganosas. Separa o que foi
// compartilhado (outbound) do eco no tráfego (visitas/contatos que chegaram por
// indicação) — são lentes diferentes, e hoje uma pode existir sem a outra.
function Referral({ r }) {
  const semShares = r.shares === 0;
  return (
    <>
      <h3 className="font-display text-[14px] mt-5 mb-2">Indicações · métrica-norte</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <Stat
          valor={r.shares}
          rotulo="Shares registrados"
          sub={`${r.porTipo.share_perfil} perfil · ${r.porTipo.share_pos_avaliacao} pós-aval. · ${r.porTipo.share_pedir_avaliacao} pedido-aval.`}
        />
        <Stat valor={r.profissionaisAlcancados} rotulo="Profissionais indicados" />
        <Stat
          valor={r.contatosIndicacao}
          rotulo="Contatos por indicação"
          sub={`${r.visitasIndicacao} visita${r.visitasIndicacao === 1 ? "" : "s"} via link`}
        />
      </div>

      {semShares ? (
        <p className="text-[12px] text-brand-grey-light mt-2 leading-relaxed">
          Ninguém usou o botão “Indicar” nesta janela ainda. O instrumento está no ar — assim que
          houver compartilhamentos, a quebra por canal aparece aqui. As visitas por indicação acima
          vêm de links de divulgação (UTM), que não passam pelo botão.
        </p>
      ) : (
        <>
          <h4 className="text-[12px] font-bold text-brand-grey mt-3 mb-1.5">
            Como foi compartilhado
          </h4>
          <div className="bg-brand-card rounded-[10px] border border-brand-border divide-y divide-brand-border">
            {r.porCanal.map((c) => (
              <div key={c.canal} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[13px] text-brand-text">
                  {ROTULO_CANAL_SHARE[c.canal] || c.canal}
                </span>
                <span className="text-[13px] font-bold text-brand-grey">{c.total}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Trafego({ a }) {
  if (a === null) {
    return (
      <p className="text-[13px] text-brand-grey-light">
        Configure <code className="text-brand-text">SUPABASE_SERVICE_ROLE_KEY</code> para ver o
        tráfego e a conversão da jornada.
      </p>
    );
  }
  if (a.visitas === 0 && a.referral.shares === 0) {
    return (
      <p className="text-[13px] text-brand-grey-light">
        Ainda sem eventos registrados nesta janela. Assim que houver navegação, os números aparecem
        aqui.
      </p>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <Stat valor={a.visitantes} rotulo="Visitantes" sub={`${a.visitas} visitas`} />
        <Stat valor={a.perfilViews} rotulo="Views de perfil" />
        <Stat valor={a.contatos} rotulo="Contatos" sub={`${a.taxaContato}% dos visitantes`} />
      </div>

      <Referral r={a.referral} />

      <h3 className="font-display text-[14px] mt-5 mb-2">Tendência por dia</h3>
      <div className="bg-brand-card rounded-[10px] border border-brand-border p-3.5">
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
          <LegendaItem cor="var(--text)">Visitas</LegendaItem>
          <LegendaItem cor="var(--grey)">Views de perfil</LegendaItem>
          <LegendaItem cor="var(--red)">Contatos</LegendaItem>
        </div>
        <GraficoTendencia serie={a.serie} />
      </div>

      <h3 className="font-display text-[14px] mt-5 mb-2">Por canal</h3>
      <div className="bg-brand-card rounded-[10px] border border-brand-border divide-y divide-brand-border">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 text-[10px] text-brand-grey-light uppercase tracking-[0.5px]">
          <span>Origem</span>
          <span className="text-right w-16">Visitantes</span>
          <span className="text-right w-16">Contatos</span>
        </div>
        {a.porCanal.map((c) => (
          <div
            key={c.origem}
            className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 items-center"
          >
            <span className="text-[13px] text-brand-text truncate">{c.origem}</span>
            <span className="text-[13px] text-brand-grey text-right w-16">{c.visitantes}</span>
            <span className="text-[13px] font-bold text-brand-text text-right w-16">
              {c.contatos}
              <span className="text-[11px] font-normal text-brand-grey-light">
                {" "}
                ({c.pctContato}%)
              </span>
            </span>
          </div>
        ))}
      </div>

      <h3 className="font-display text-[14px] mt-5 mb-2">Funil da jornada</h3>
      <div className="space-y-1.5">
        {a.funil.map((f) => (
          <div key={f.etapa} className="flex items-center gap-3">
            <span className="text-[12px] text-brand-grey w-20 shrink-0">{f.etapa}</span>
            <div className="flex-1 bg-brand-surface rounded-[5px] h-6 overflow-hidden border border-brand-border">
              <div
                className="bg-brand-red h-full flex items-center px-2"
                style={{ width: `${Math.max(f.pct, f.sessoes > 0 ? 6 : 0)}%` }}
              >
                <span className="text-[11px] font-bold text-white whitespace-nowrap">
                  {f.sessoes}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-brand-grey-light w-10 text-right shrink-0">
              {f.pct}%
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Desempenho() {
  return (
    <div className="bg-brand-card rounded-[10px] border border-brand-border p-4">
      <p className="text-[13px] text-brand-grey leading-relaxed">
        Os Web Vitals (LCP, INP, CLS) são coletados em campo pelo Vercel Speed Insights, com
        percentis (p75) e quebra por página. Acompanhe a saúde de carregamento e interação no
        dashboard da Vercel.
      </p>
      <a
        href="https://vercel.com/leonardo-cobra/rede-parque-dos-sinos-kwfd/speed-insights"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-3 text-[13px] font-bold text-brand-red"
      >
        Abrir Speed Insights na Vercel →
      </a>
    </div>
  );
}

export default function AdminClient({ email, v, a, s, janelaDias }) {
  const [secao, setSecao] = useState("oferta");

  return (
    <div className="px-5 py-6 max-w-[680px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[26px]">Painel da Rede</h1>
        <SairButton />
      </div>
      <p className="text-[13px] text-brand-grey-light mt-1 mb-4">
        Visão interna · conectado como <strong>{email}</strong>
      </p>

      <Pilulas secoes={SECOES} ativo={secao} onChange={setSecao} className="mb-5" />

      {secao === "trafego" && (
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-[16px]">Tráfego e jornada</h2>
          <span className="text-[11px] text-brand-grey-light">últimos {janelaDias} dias</span>
        </div>
      )}

      {secao === "oferta" && <Oferta v={v} s={s} />}
      {secao === "trafego" && <Trafego a={a} />}
      {secao === "desempenho" && <Desempenho />}
      {secao === "agente" && <AgenteChat />}
    </div>
  );
}
