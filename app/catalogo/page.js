"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import { CATS, catIcon } from "../config";
import { instagramUrl } from "../../lib/instagram";
import { iniciais } from "../../lib/avatar";
import { computeStats, sortProfissionais, ORDENACOES, ORDENACAO_PADRAO } from "../../lib/catalogo";
import { WhatsAppIcon, InstagramIcon, ShareIcon } from "../components/SocialIcons";
import { track } from "@vercel/analytics";
import { categoriaParaSlug } from "../../lib/categorias";

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Compartilha o link do perfil público no WhatsApp. Monta a URL absoluta no
// clique (evita mismatch de hidratação) e registra a métrica de compartilhamento.
function compartilharPerfil(p) {
  const url = `${window.location.origin}/profissional/${p.id}`;
  const texto = `Encontrei ${p.nome} na Rede: ${url}`;
  track("perfil_share", { canal: "whatsapp", id: p.id });
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
}

function CatalogoContent() {
  const searchParams = useSearchParams();
  const [profs, setProfs] = useState([]);
  const [avals, setAvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(searchParams.get("cat") || null);
  const [ordenacao, setOrdenacao] = useState(ORDENACAO_PADRAO);
  const [openId, setOpenId] = useState(null);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("profissionais").select("*").order("criado_em", { ascending: false }),
      supabase.from("avaliacoes").select("*"),
    ]);
    setProfs(p || []);
    setAvals(a || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function stats(profId) {
    return computeStats(profId, avals);
  }

  const filtered = profs.filter((p) => {
    const s = normalize(search);
    return (
      (!s ||
        normalize(p.nome).includes(s) ||
        normalize(p.servico).includes(s) ||
        normalize(p.bairro).includes(s)) &&
      (!catFilter || p.categoria === catFilter)
    );
  });

  const ordenados = sortProfissionais(filtered, avals, ordenacao);

  return (
    <>
      <Nav />
      <div className="px-5 max-w-[560px] mx-auto">
        <div className="flex items-center justify-between mb-4 pt-5">
          <h2 className="font-display text-[26px]">Catálogo</h2>
          <button
            onClick={load}
            disabled={loading}
            className={`bg-brand-surface border border-brand-border rounded-[6px] px-3 py-1.5 text-[11px] font-bold text-brand-grey ${
              loading ? "opacity-50" : ""
            }`}
          >
            ↻ Atualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 px-5">
            <div className="w-9 h-9 border-[3px] border-brand-border border-t-brand-red rounded-full animate-spin mx-auto mb-3.5" />
            <p className="text-brand-grey-light text-[13px]">Carregando...</p>
          </div>
        ) : (
          <>
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
              <div className="text-center py-12 px-5">
                <div className="text-[32px] mb-2 opacity-40">
                  {profs.length === 0 ? "📋" : "🔍"}
                </div>
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

            {ordenados.map((p, i) => {
              const st = stats(p.id);
              const open = openId === p.id;
              const wn = (p.telefone || "").replace(/\D/g, "");
              const ig = instagramUrl(p.instagram);
              const ini = iniciais(p.nome);
              return (
                <div
                  key={p.id}
                  className={`fade-up bg-brand-card rounded-[10px] mb-2.5 border transition-colors duration-200 ${
                    open ? "border-brand-red" : "border-brand-border"
                  }`}
                  style={{ animationDelay: Math.min(i, 10) * 0.03 + "s" }}
                >
                  <div
                    onClick={() => setOpenId(open ? null : p.id)}
                    className="p-4 cursor-pointer flex gap-3.5 items-start"
                  >
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
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-[15px]">{p.nome}</span>
                        {st?.recomendado && (
                          <span className="bg-brand-red-light text-brand-red font-bold text-[10px] px-2.5 py-[3px] rounded-[4px] uppercase tracking-[0.6px]">
                            Recomendado
                          </span>
                        )}
                        {p.verificado && (
                          <span
                            title="Identidade confirmada pela Rede"
                            className="bg-brand-black text-white font-bold text-[10px] px-2.5 py-[3px] rounded-[4px] uppercase tracking-[0.6px] inline-flex items-center gap-1"
                          >
                            ✓ Verificado
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] text-brand-red font-bold">
                        {catIcon(p.categoria)} {p.servico}
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
                  {open && (
                    <div className="px-4 pb-4 border-t border-brand-border pt-3.5">
                      {p.descricao && (
                        <p className="text-[13px] text-brand-grey leading-relaxed mb-3">
                          {p.descricao}
                        </p>
                      )}
                      {p.regioes && (
                        <div className="text-xs text-brand-grey-light mb-1.5">
                          Atende: {p.regioes}
                        </div>
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
                      <div className="flex items-center justify-end gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => compartilharPerfil(p)}
                          aria-label="Compartilhar perfil no WhatsApp"
                          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-grey"
                        >
                          <ShareIcon />
                          Compartilhar
                        </button>
                        <Link
                          href={"/profissional/" + p.id}
                          className="text-[12px] font-bold text-brand-red"
                        >
                          Ver perfil completo →
                        </Link>
                      </div>
                      <div className="flex gap-2">
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
                    </div>
                  )}
                </div>
              );
            })}

            <div className="text-right mt-5 pb-5">
              <Link
                href="/cadastro"
                className="bg-brand-red text-white rounded-lg px-8 py-3 text-sm font-bold inline-block"
              >
                + Cadastrar Meu Serviço
              </Link>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

export default function Catalogo() {
  return (
    <Suspense>
      <CatalogoContent />
    </Suspense>
  );
}
