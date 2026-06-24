"use client";

// Aba "IA" do /admin: métricas de ai_invocacoes (tokens, custo, latência, erros).
// Recebe `ia` = resultado de computeObservabilidadeIA (já serializado no servidor).

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

function formatarCusto(c) {
  if (c === 0) return "$0.000000";
  if (c < 0.000001) return `$${c.toFixed(8)}`;
  return `$${c.toFixed(6)}`;
}

function formatarMs(ms) {
  if (!ms) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

function rotaLabel(rota) {
  return rota.replace("/api/ai/", "/").replace("/api/", "/");
}

export default function ObservabilidadeIA({ ia, janelaDias }) {
  if (!ia) {
    return (
      <p className="text-[13px] text-brand-grey-light">
        Configure <code className="text-brand-text">SUPABASE_SERVICE_ROLE_KEY</code> para ver as
        métricas de IA.
      </p>
    );
  }

  if (ia.total === 0) {
    return (
      <p className="text-[13px] text-brand-grey-light">
        Ainda sem invocações registradas nesta janela. Os números aparecem assim que houver uso do
        onboarding ou do agente.
      </p>
    );
  }

  return (
    <>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-[16px]">Observabilidade de IA</h2>
        <span className="text-[11px] text-brand-grey-light">últimos {janelaDias} dias</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <Stat valor={ia.total} rotulo="Invocações" sub={`${ia.sucesso} ok · ${ia.falhas} falha${ia.falhas !== 1 ? "s" : ""}`} />
        <Stat valor={`${ia.taxaSucesso}%`} rotulo="Taxa de sucesso" />
        <Stat valor={formatarCusto(ia.custoTotal)} rotulo="Custo total (USD)" />
        <Stat
          valor={(ia.tokensIn + ia.tokensOut).toLocaleString("pt-BR")}
          rotulo="Tokens totais"
          sub={`${ia.tokensIn.toLocaleString("pt-BR")} in · ${ia.tokensOut.toLocaleString("pt-BR")} out`}
        />
        <Stat valor={formatarMs(ia.latenciaMedia)} rotulo="Latência média" sub={`p95: ${formatarMs(ia.latenciaP95)}`} />
        {ia.evalMediaScore !== null ? (
          <Stat valor={`${ia.evalMediaScore}/5`} rotulo="Eval score médio" />
        ) : (
          <Stat valor="—" rotulo="Eval score médio" sub="sem avaliações" />
        )}
      </div>

      <h3 className="font-display text-[14px] mt-6 mb-2">Por rota</h3>
      <div className="bg-brand-card rounded-[10px] border border-brand-border divide-y divide-brand-border">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2 text-[10px] text-brand-grey-light uppercase tracking-[0.5px]">
          <span>Rota</span>
          <span className="text-right w-12">Calls</span>
          <span className="text-right w-14">Tokens</span>
          <span className="text-right w-20">Custo</span>
        </div>
        {ia.porRota.map((r) => (
          <div
            key={r.rota}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-4 py-2.5 items-center"
          >
            <span className="text-[12px] text-brand-text font-mono truncate">
              {rotaLabel(r.rota)}
              {r.falhas > 0 && (
                <span className="ml-1.5 text-[10px] text-brand-red font-sans font-bold">
                  {r.falhas} falha{r.falhas !== 1 ? "s" : ""}
                </span>
              )}
            </span>
            <span className="text-[13px] text-brand-grey text-right w-12">{r.total}</span>
            <span className="text-[12px] text-brand-grey text-right w-14">
              {r.tokensTotal.toLocaleString("pt-BR")}
            </span>
            <span className="text-[12px] text-brand-grey text-right w-20">
              {formatarCusto(r.custoTotal)}
            </span>
          </div>
        ))}
      </div>

      {ia.ultimasFalhas.length > 0 && (
        <>
          <h3 className="font-display text-[14px] mt-6 mb-2">Últimas falhas</h3>
          <div className="bg-brand-card rounded-[10px] border border-brand-border divide-y divide-brand-border">
            {ia.ultimasFalhas.map((f) => (
              <div key={f.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[12px] font-mono text-brand-text">{rotaLabel(f.rota)}</span>
                  <span className="text-[11px] text-brand-grey-light shrink-0">
                    {new Date(f.criado_em).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[12px] text-brand-grey line-clamp-2">{f.erro}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
