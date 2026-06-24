"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CATS, catIcon } from "../config";
import { instagramUrl } from "../../lib/instagram";
import { iniciais } from "../../lib/avatar";
import { computeStats, sortProfissionais, ORDENACOES, ORDENACAO_PADRAO } from "../../lib/catalogo";
import { WhatsAppIcon, InstagramIcon } from "../components/ui/SocialIcons";
import { categoriaParaSlug } from "../../lib/categorias";
import BotoesCompartilhar from "../components/features/BotoesCompartilhar";
import ServicosInterativos from "../profissional/[id]/ServicosInterativos";

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function CatalogoContent({ initialProfs, initialAvals }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [profs] = useState(initialProfs);
  const [avals] = useState(initialAvals);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(searchParams.get("cat") || null);
  const [ordenacao, setOrdenacao] = useState(ORDENACAO_PADRAO);
  const [openId, setOpenId] = useState(null);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
  }

  function stats(profId) {
    return computeStats(profId, avals);
  }

  const filtered = profs.filter((p) => {
    const s = normalize(search);
    const textoServicos = normalize(
      (p.profissional_servicos || []).map((sv) => sv.servico).join(" ")
    );
    return (
      (!s ||
        normalize(p.nome).includes(s) ||
        textoServicos.includes(s) ||
        normalize(p.bairro).includes(s)) &&
      (!catFilter || (p.profissional_servicos || []).some((sv) => sv.categoria === catFilter))
    );
  });

  const ordenados = sortProfissionais(filtered, avals, ordenacao);

  // Fallback semântico: quando a busca por palavra-chave não encontra nada,
  // tenta a busca inteligente (entende "consertar encanamento" → Encanador).
  // Só dispara com termo de busca e zero resultados de keyword.
  const termo = search.trim();
  const semDeveBuscar = termo.length >= 3 && filtered.length === 0 && profs.length > 0;
  const [sugestoes, setSugestoes] = useState([]);
  const [buscandoIA, setBuscandoIA] = useState(false);

  useEffect(() => {
    if (!semDeveBuscar) {
      setSugestoes([]);
      setBuscandoIA(false);
      return;
    }
    const ctrl = new AbortController();
    setBuscandoIA(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: termo });
        if (catFilter) params.set("categoria", catFilter);
        const res = await fetch(`/api/busca-semantica?${params}`, { signal: ctrl.signal });
        const json = await res.json();
        // Dedupe por profissional — um perfil pode ter vários serviços.
        const vistos = new Set();
        const unicos = (json.resultados || []).filter((r) => {
          if (vistos.has(r.profissional_id)) return false;
          vistos.add(r.profissional_id);
          return true;
        });
        setSugestoes(unicos);
      } catch (e) {
        if (e.name !== "AbortError") setSugestoes([]);
      } finally {
        setBuscandoIA(false);
      }
    }, 400);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [termo, semDeveBuscar, catFilter]);

  return (
    <div className="px-5 max-w-[560px] md:max-w-[940px] mx-auto">
      <div className="flex items-center justify-between mb-4 pt-5">
        <h2 className="font-display text-[26px]">Catálogo</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`bg-brand-surface border border-brand-border rounded-[6px] px-3 py-1.5 text-[11px] font-bold text-brand-grey ${
            refreshing ? "opacity-50" : ""
          }`}
        >
          ↻ Atualizar
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nome, serviço ou bairro..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-brand-card outline-none mb-2.5"
      />

      <div className="flex gap-[5px] overflow-x-auto pb-1.5 mb-3">
        <button
          onClick={() => setCatFilter(null)}
          className={`rounded-[6px] px-3 py-[5px] text-[11px] font-bold whitespace-nowrap border ${
            !catFilter
              ? "bg-brand-black text-white border-brand-black"
              : "bg-brand-surface text-brand-grey border-brand-border"
          }`}
        >
          Todos
        </button>
        {CATS.map((c) => (
          <Link
            key={c.value}
            href={`/catalogo/${categoriaParaSlug(c.value)}`}
            onClick={(e) => {
              e.preventDefault();
              setCatFilter(catFilter === c.value ? null : c.value);
            }}
            className={`rounded-[6px] px-3 py-[5px] text-[11px] font-bold whitespace-nowrap border ${
              catFilter === c.value
                ? "bg-brand-red text-white border-brand-red"
                : "bg-brand-surface text-brand-grey border-brand-border"
            }`}
          >
            {c.icon} {c.value}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-[11px] text-brand-grey-light">
          {filtered.length} {filtered.length === 1 ? "profissional" : "profissionais"}
        </div>
        <label className="flex items-center gap-1.5 text-[11px] text-brand-grey-light">
          <span className="font-bold uppercase tracking-[0.5px]">Ordenar</span>
          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
            aria-label="Ordenar profissionais"
            className="bg-brand-surface border border-brand-border rounded-[6px] px-2 py-1 text-[11px] font-bold text-brand-grey outline-none"
          >
            {ORDENACOES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 px-5">
          {buscandoIA ? (
            <div className="text-center">
              <div className="text-[32px] mb-2 opacity-40 animate-pulse">✨</div>
              <div className="text-sm font-bold text-brand-grey">Buscando com IA…</div>
            </div>
          ) : sugestoes.length > 0 ? (
            <div>
              <div className="text-[13px] text-brand-grey-light mb-3 text-center">
                Nada exato para <span className="font-bold text-brand-grey">“{termo}”</span>. Você
                quis dizer:
              </div>
              <div className="grid gap-2.5 md:grid-cols-2">
                {sugestoes.map((s) => (
                  <Link
                    key={s.servico_id}
                    href={"/profissional/" + s.profissional_id}
                    className="block bg-brand-card rounded-[10px] border border-brand-border p-4 hover:border-brand-red transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[15px] truncate">{s.nome}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-brand-grey-light font-bold">
                        ✨ sugestão
                      </span>
                    </div>
                    <div className="text-[13px] text-brand-red font-bold">
                      {catIcon(s.categoria)} {s.servico}
                    </div>
                    {s.bairro && (
                      <div className="text-xs text-brand-grey-light mt-1">📍 {s.bairro}</div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-[32px] mb-2 opacity-40">{profs.length === 0 ? "📋" : "🔍"}</div>
              <div className="text-sm font-bold text-brand-grey">
                {profs.length === 0 ? "Nenhum profissional cadastrado ainda" : "Nenhum resultado"}
              </div>
              {profs.length === 0 && (
                <Link
                  href="/cadastro"
                  className="inline-block mt-3.5 bg-brand-red text-white rounded-lg px-6 py-2.5 text-[13px] font-bold"
                >
                  Seja o primeiro
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-2.5 md:grid-cols-2">
        {ordenados.map((p, i) => {
          const st = stats(p.id);
          const open = openId === p.id;
          const wn = (p.telefone || "").replace(/\D/g, "");
          const ini = iniciais(p.nome);
          const servicos = p.profissional_servicos || [];
          const servicoPrimario = servicos[0]?.servico || "";
          const igHandle = servicos.find((s) => s.instagram)?.instagram || p.instagram;
          const ig = instagramUrl(igHandle);
          return (
            <div
              key={p.id}
              className={`fade-up bg-brand-card rounded-[10px] border transition-colors duration-200 flex flex-col ${
                open ? "border-brand-red md:col-span-2" : "border-brand-border"
              }`}
              style={{ animationDelay: Math.min(i, 10) * 0.03 + "s" }}
            >
              <div
                onClick={() => setOpenId(open ? null : p.id)}
                className="p-4 cursor-pointer flex-1"
              >
                <div className="flex gap-3.5 items-start">
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
                      {st?.recomendado && (
                        <span className="shrink-0 bg-brand-red-light text-brand-red font-bold text-[10px] px-2.5 py-[3px] rounded-[4px] uppercase tracking-[0.6px]">
                          Recomendado
                        </span>
                      )}
                      {p.verificado && (
                        <span
                          title="Identidade confirmada pela Rede"
                          className="ml-auto shrink-0 bg-brand-black text-white font-bold text-[10px] px-2.5 py-[3px] rounded-[4px] uppercase tracking-[0.6px] inline-flex items-center gap-1"
                        >
                          ✓ Verificado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-brand-grey-light mt-0.5">
                      {p.bairro && "📍 " + p.bairro}
                      {p.experiencia ? " · " + p.experiencia : ""}
                    </div>
                    {st && (
                      <div className="mt-1.5 text-brand-red text-[13px] tracking-[1px]">
                        {"★".repeat(Math.round(st.avg))}
                        {"☆".repeat(5 - Math.round(st.avg))}
                        <span className="text-brand-text ml-1.5 text-xs font-semibold">
                          {st.avg.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-brand-grey-light ml-1.5">
                          ({st.count})
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-base text-brand-grey-light shrink-0 mt-1 transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </div>
                {/* Serviços sempre abaixo da foto (full-width) para não quebrar
                    a simetria da lateral quando há vários serviços. */}
                {!open && (
                  <>
                    {servicos.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {servicos.map((sv) => (
                          <span
                            key={sv.id}
                            className="bg-brand-surface border border-brand-border rounded-[6px] px-2.5 py-[5px] text-[13px] text-brand-red font-bold"
                          >
                            {catIcon(sv.categoria)} {sv.servico}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 text-right">
                      <Link
                        href={"/profissional/" + p.id}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[12px] font-bold text-brand-red"
                      >
                        Ver perfil completo →
                      </Link>
                    </div>
                  </>
                )}
              </div>
              {open && (
                <div className="px-4 pb-4 border-t border-brand-border pt-3.5">
                  {servicos.length > 0 && (
                    <div className="mb-3">
                      <ServicosInterativos servicos={servicos} bioFallback={p.descricao} />
                    </div>
                  )}
                  {p.regioes && (
                    <div className="text-xs text-brand-grey-light mb-1.5">Atende: {p.regioes}</div>
                  )}
                  {st && st.count > 0 && (
                    <div className="flex gap-2 mb-3.5 flex-wrap">
                      {[
                        { l: "Pontual", v: st.pontual },
                        { l: "Contrataria", v: st.novamente },
                        { l: "Conforme", v: st.conforme },
                      ].map((s, j) => (
                        <div
                          key={j}
                          className="bg-brand-surface rounded-[6px] px-3 py-2 flex-1 min-w-[70px] text-center border border-brand-border"
                        >
                          <div className="text-[18px] font-extrabold">{s.v}%</div>
                          <div className="text-[9px] text-brand-grey-light font-bold uppercase tracking-[0.5px]">
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                      href={"/avaliar?id=" + p.id + "&nome=" + encodeURIComponent(p.nome)}
                      className="bg-brand-card text-brand-text border-[1.5px] border-brand-border rounded-lg px-5 py-2.5 text-[13px] font-bold flex-1 text-center"
                    >
                      Avaliar
                    </Link>
                  </div>
                  <BotoesCompartilhar id={p.id} nome={p.nome} servico={servicoPrimario} />
                  <div className="text-right mt-2">
                    <Link
                      href={"/profissional/" + p.id}
                      className="text-[12px] font-bold text-brand-red"
                    >
                      Ver perfil completo →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-right mt-5 pb-5">
        <Link
          href="/cadastro"
          className="bg-brand-red text-white rounded-lg px-8 py-3 text-sm font-bold inline-block"
        >
          + Cadastrar Meu Serviço
        </Link>
      </div>
    </div>
  );
}

export default function CatalogoClient({ initialProfs, initialAvals }) {
  return (
    <Suspense>
      <CatalogoContent initialProfs={initialProfs} initialAvals={initialAvals} />
    </Suspense>
  );
}
