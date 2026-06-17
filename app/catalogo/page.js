"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import { CATS, catIcon } from "../config";
import { instagramUrl } from "../../lib/instagram";

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.882 11.882 0 005.71 1.448h.005c6.582 0 11.940-5.359 11.943-11.893a11.821 11.821 0 00-3.473-8.464" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function CatalogoContent() {
  const searchParams = useSearchParams();
  const [profs, setProfs] = useState([]);
  const [avals, setAvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(searchParams.get("cat") || null);
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
    const m = avals.filter((a) => a.profissional_id === profId);
    if (!m.length) return null;
    const avg = m.reduce((s, a) => s + a.nota, 0) / m.length;
    const pontual = Math.round((m.filter((a) => a.pontual).length / m.length) * 100);
    const novamente = Math.round((m.filter((a) => a.novamente).length / m.length) * 100);
    const conforme = Math.round((m.filter((a) => a.conforme).length / m.length) * 100);
    return {
      avg: Math.round(avg * 10) / 10,
      count: m.length,
      pontual,
      novamente,
      conforme,
      recomendado: novamente >= 80 && m.length >= 3,
    };
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
                <button
                  key={c.value}
                  onClick={() => setCatFilter(catFilter === c.value ? null : c.value)}
                  className={`rounded-[6px] px-3 py-[5px] text-[11px] font-bold whitespace-nowrap border ${
                    catFilter === c.value
                      ? "bg-brand-red text-white border-brand-red"
                      : "bg-brand-surface text-brand-grey border-brand-border"
                  }`}
                >
                  {c.icon} {c.value}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-brand-grey-light mb-3">
              {filtered.length} {filtered.length === 1 ? "profissional" : "profissionais"}
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

            {filtered.map((p, i) => {
              const st = stats(p.id);
              const open = openId === p.id;
              const wn = (p.telefone || "").replace(/\D/g, "");
              const ig = instagramUrl(p.instagram);
              const ini = p.nome
                .split(" ")
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
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
                    <div className="w-[46px] h-[46px] rounded-lg bg-brand-surface flex items-center justify-center text-[13px] font-extrabold text-brand-red shrink-0 border border-brand-border">
                      {ini}
                    </div>
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

            <div className="text-center mt-5 pb-5">
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
