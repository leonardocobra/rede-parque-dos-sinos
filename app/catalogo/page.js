"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import { CATS, catIcon } from "../config";

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
      <div style={{ padding: "20px", maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontFamily: "var(--display)", fontSize: 26 }}>Catálogo</h2>
          <button
            onClick={load}
            disabled={loading}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--grey)",
              opacity: loading ? 0.5 : 1,
            }}
          >
            ↻ Atualizar
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                border: "3px solid var(--border)",
                borderTopColor: "var(--red)",
                borderRadius: "50%",
                animation: "spin .8s linear infinite",
                margin: "0 auto 14px",
              }}
            />
            <p style={{ color: "var(--grey-light)", fontSize: 13 }}>Carregando...</p>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Buscar por nome, serviço ou bairro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                fontSize: 14,
                background: "#fff",
                outline: "none",
                marginBottom: 10,
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 5,
                overflowX: "auto",
                paddingBottom: 6,
                marginBottom: 12,
              }}
            >
              <button
                onClick={() => setCatFilter(null)}
                style={{
                  background: !catFilter ? "var(--black)" : "var(--bg)",
                  color: !catFilter ? "#fff" : "var(--grey)",
                  border: "1px solid " + (!catFilter ? "var(--black)" : "var(--border)"),
                  borderRadius: 6,
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Todos
              </button>
              {CATS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCatFilter(catFilter === c.value ? null : c.value)}
                  style={{
                    background: catFilter === c.value ? "var(--red)" : "var(--bg)",
                    color: catFilter === c.value ? "#fff" : "var(--grey)",
                    border: "1px solid " + (catFilter === c.value ? "var(--red)" : "var(--border)"),
                    borderRadius: 6,
                    padding: "5px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.icon} {c.value}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, color: "var(--grey-light)", marginBottom: 12 }}>
              {filtered.length} profissional{filtered.length !== 1 ? "is" : ""}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>
                  {profs.length === 0 ? "📋" : "🔍"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--grey)" }}>
                  {profs.length === 0 ? "Nenhum profissional cadastrado ainda" : "Nenhum resultado"}
                </div>
                {profs.length === 0 && (
                  <Link
                    href="/cadastro"
                    style={{
                      display: "inline-block",
                      marginTop: 14,
                      background: "var(--red)",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "10px 24px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
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
                  className="fade-up"
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    marginBottom: 10,
                    border: "1px solid " + (open ? "var(--red)" : "var(--border)"),
                    animationDelay: Math.min(i, 10) * 0.03 + "s",
                    transition: "border .2s",
                  }}
                >
                  <div
                    onClick={() => setOpenId(open ? null : p.id)}
                    style={{
                      padding: 16,
                      cursor: "pointer",
                      display: "flex",
                      gap: 14,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 8,
                        background: "var(--bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 800,
                        color: "var(--red)",
                        flexShrink: 0,
                        border: "1px solid var(--border)",
                      }}
                    >
                      {ini}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 2,
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{p.nome}</span>
                        {st?.recomendado && (
                          <span
                            style={{
                              background: "var(--red-light)",
                              color: "var(--red)",
                              fontWeight: 700,
                              fontSize: 10,
                              padding: "3px 10px",
                              borderRadius: 4,
                              textTransform: "uppercase",
                              letterSpacing: 0.6,
                            }}
                          >
                            Recomendado
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 700 }}>
                        {catIcon(p.categoria)} {p.servico}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--grey-light)", marginTop: 2 }}>
                        {p.bairro && "📍 " + p.bairro}
                        {p.experiencia ? " · " + p.experiencia : ""}
                      </div>
                      {st && (
                        <div
                          style={{
                            marginTop: 6,
                            color: "var(--red)",
                            fontSize: 13,
                            letterSpacing: 1,
                          }}
                        >
                          {"★".repeat(Math.round(st.avg))}
                          {"☆".repeat(5 - Math.round(st.avg))}
                          <span
                            style={{
                              color: "var(--black)",
                              marginLeft: 6,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {st.avg.toFixed(1)}
                          </span>
                          <span style={{ fontSize: 10, color: "var(--grey-light)", marginLeft: 6 }}>
                            ({st.count})
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 16,
                        color: "var(--grey-light)",
                        flexShrink: 0,
                        marginTop: 4,
                        transform: open ? "rotate(180deg)" : "none",
                        transition: "transform .2s",
                      }}
                    >
                      ▾
                    </span>
                  </div>
                  {open && (
                    <div
                      style={{
                        padding: "0 16px 16px",
                        borderTop: "1px solid var(--border)",
                        marginTop: -2,
                        paddingTop: 14,
                      }}
                    >
                      {p.descricao && (
                        <p
                          style={{
                            fontSize: 13,
                            color: "var(--grey)",
                            lineHeight: 1.6,
                            marginBottom: 12,
                          }}
                        >
                          {p.descricao}
                        </p>
                      )}
                      {p.regioes && (
                        <div style={{ fontSize: 12, color: "var(--grey-light)", marginBottom: 6 }}>
                          Atende: {p.regioes}
                        </div>
                      )}
                      {p.instagram && (
                        <div style={{ fontSize: 12, color: "var(--grey-light)", marginBottom: 6 }}>
                          Instagram: {p.instagram}
                        </div>
                      )}
                      {st && st.count > 0 && (
                        <div
                          style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}
                        >
                          {[
                            { l: "Pontual", v: st.pontual },
                            { l: "Contrataria", v: st.novamente },
                            { l: "Conforme", v: st.conforme },
                          ].map((s, j) => (
                            <div
                              key={j}
                              style={{
                                background: "var(--bg)",
                                borderRadius: 6,
                                padding: "8px 12px",
                                flex: 1,
                                minWidth: 70,
                                textAlign: "center",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div style={{ fontSize: 18, fontWeight: 800 }}>{s.v}%</div>
                              <div
                                style={{
                                  fontSize: 9,
                                  color: "var(--grey-light)",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                {s.l}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8 }}>
                        {wn && (
                          <a
                            href={"https://wa.me/55" + wn}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: "#25D366",
                              color: "#fff",
                              borderRadius: 8,
                              padding: "10px 20px",
                              fontSize: 13,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              flex: 1,
                              justifyContent: "center",
                            }}
                          >
                            📞 WhatsApp
                          </a>
                        )}
                        <Link
                          href={"/avaliar?id=" + p.id + "&nome=" + encodeURIComponent(p.nome)}
                          style={{
                            background: "#fff",
                            color: "var(--black)",
                            border: "1.5px solid var(--border)",
                            borderRadius: 8,
                            padding: "10px 20px",
                            fontSize: 13,
                            fontWeight: 700,
                            flex: 1,
                            textAlign: "center",
                          }}
                        >
                          Avaliar
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ textAlign: "center", marginTop: 20, paddingBottom: 20 }}>
              <Link
                href="/cadastro"
                style={{
                  background: "var(--red)",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "12px 32px",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "inline-block",
                }}
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
