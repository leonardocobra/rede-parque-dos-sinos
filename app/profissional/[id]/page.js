import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import PerfilView from "./PerfilView";
import ContatoBotoes from "./ContatoBotoes";
import { getProfissional, getAvaliacoesDe, getOutrosDaCategoria } from "../../../lib/profissionais";
import { computeStats } from "../../../lib/catalogo";
import { iniciais } from "../../../lib/avatar";
import { instagramUrl } from "../../../lib/instagram";
import {
  tituloPerfil,
  descricaoPerfil,
  whatsappLink,
  perfilJsonLd,
  servicoPrimario,
  categoriaPrimaria,
  CIDADE,
} from "../../../lib/perfil";
import { absUrl } from "../../../lib/site";
import ServicosInterativos from "./ServicosInterativos";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const prof = await getProfissional(params.id);
  if (!prof) return { title: "Profissional não encontrado · A Rede" };
  const title = tituloPerfil(prof);
  const description = descricaoPerfil(prof);
  const url = `/profissional/${params.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "profile", url },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Estrelas({ nota }) {
  const n = Math.round(nota || 0);
  return (
    <span className="text-brand-red tracking-[1px]" aria-label={`${nota} de 5`}>
      {"★".repeat(n)}
      {"☆".repeat(5 - n)}
    </span>
  );
}

export default async function PerfilPage({ params }) {
  const { id } = params;
  const prof = await getProfissional(id);
  if (!prof) notFound();

  const categoriaPrincipal = categoriaPrimaria(prof);
  const [avals, outros] = await Promise.all([
    getAvaliacoesDe(id),
    getOutrosDaCategoria(categoriaPrincipal, id),
  ]);

  const st = computeStats(id, avals);
  const ini = iniciais(prof.nome);
  const wa = whatsappLink(prof.telefone);
  const ig = instagramUrl(prof.instagram);
  const comentarios = avals.filter((a) => (a.comentario || "").trim());
  const jsonLd = perfilJsonLd(prof, st, absUrl(`/profissional/${id}`));
  const servicos = prof.profissional_servicos || [];

  const percentuais = st
    ? [
        { l: "Pontual", v: st.pontual },
        { l: "Contrataria", v: st.novamente },
        { l: "Conforme", v: st.conforme },
      ]
    : [];

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PerfilView id={id} nome={prof.nome} />
      <Nav />
      <div className="px-5 max-w-[560px] mx-auto pt-5 pb-8">
        <Link href="/catalogo" className="text-[12px] text-brand-grey-light font-bold">
          ← Voltar ao catálogo
        </Link>

        {/* Cabeçalho */}
        <header className="bg-brand-card rounded-[10px] border border-brand-border p-5 mt-3 flex gap-4 items-start">
          {prof.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={prof.foto_url}
              alt={"Foto de " + prof.nome}
              className="w-[72px] h-[72px] rounded-xl object-cover shrink-0 border border-brand-border"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-xl bg-brand-surface flex items-center justify-center text-[22px] font-extrabold text-brand-red shrink-0 border border-brand-border">
              {ini}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-[22px] leading-tight">{prof.nome}</h1>
            {servicos.length > 0 && (
              <div className="text-[12px] text-brand-grey-light mt-1">
                {[...new Set(servicos.map((s) => s.categoria))].join(" · ")}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {st?.recomendado && (
                <span className="bg-brand-red-light text-brand-red font-bold text-[10px] px-2.5 py-[3px] rounded-[4px] uppercase tracking-[0.6px]">
                  Recomendado
                </span>
              )}
              {prof.verificado && (
                <span
                  title="Identidade confirmada pela Rede"
                  className="bg-brand-black text-white font-bold text-[10px] px-2.5 py-[3px] rounded-[4px] uppercase tracking-[0.6px] inline-flex items-center gap-1"
                >
                  ✓ Verificado
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Nota média + percentuais */}
        {st && (
          <section className="bg-brand-card rounded-[10px] border border-brand-border p-4 mt-3">
            <div className="flex items-center gap-2">
              <Estrelas nota={st.avg} />
              <span className="text-brand-text font-bold text-[15px]">{st.avg.toFixed(1)}</span>
              <span className="text-[12px] text-brand-grey-light">
                ({st.count} {st.count === 1 ? "avaliação" : "avaliações"})
              </span>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {percentuais.map((s) => (
                <div
                  key={s.l}
                  className="bg-brand-surface rounded-[6px] px-3 py-2 flex-1 min-w-[70px] text-center border border-brand-border"
                >
                  <div className="text-[18px] font-extrabold">{s.v}%</div>
                  <div className="text-[9px] text-brand-grey-light font-bold uppercase tracking-[0.5px]">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Serviços — bloco interativo reutilizado do catálogo. É aqui que vivem
            as descrições (e, no futuro, os itens/produtos) de cada serviço. */}
        {servicos.length > 0 && (
          <section className="bg-brand-card rounded-[10px] border border-brand-border p-4 mt-3">
            <h2 className="font-display text-[16px] mb-2">Serviços</h2>
            <ServicosInterativos servicos={servicos} />
          </section>
        )}

        {/* Sobre o profissional — apresentação geral (bio), separada dos serviços. */}
        {(prof.descricao || prof.experiencia || prof.regioes || prof.bairro) && (
          <section className="bg-brand-card rounded-[10px] border border-brand-border p-4 mt-3">
            {prof.descricao && (
              <p className="text-[13px] text-brand-grey leading-relaxed">{prof.descricao}</p>
            )}
            <div className="text-[12px] text-brand-grey-light mt-3 space-y-1">
              {prof.experiencia && <div>🕒 {prof.experiencia}</div>}
              {prof.bairro && <div>📍 {prof.bairro}</div>}
              {prof.regioes && <div>🗺️ Atende: {prof.regioes}</div>}
            </div>
          </section>
        )}

        {/* CTAs */}
        <div className="mt-4">
          <ContatoBotoes
            id={id}
            nome={prof.nome}
            servico={servicoPrimario(prof)}
            whatsapp={wa}
            instagram={ig}
          />
        </div>

        {/* Comentários das avaliações */}
        {comentarios.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-[18px] mb-2">O que dizem</h2>
            <div className="space-y-2.5">
              {comentarios.map((a) => (
                <div
                  key={a.id}
                  className="bg-brand-card rounded-[10px] border border-brand-border p-3.5"
                >
                  {a.profissional_servicos?.servico && (
                    <div className="text-[11px] text-brand-grey-light font-bold uppercase tracking-[0.5px] mb-1">
                      {a.profissional_servicos.servico}
                    </div>
                  )}
                  <Estrelas nota={a.nota} />
                  <p className="text-[13px] text-brand-grey leading-relaxed mt-1.5">
                    {a.comentario}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Outros profissionais da categoria */}
        {outros.length > 0 && (
          <section className="mt-7">
            <h2 className="font-display text-[18px] mb-2">Outros de {categoriaPrincipal}</h2>
            <div className="space-y-2">
              {outros.map((o) => {
                const oServicos = o.profissional_servicos || [];
                return (
                  <Link
                    key={o.id}
                    href={"/profissional/" + o.id}
                    className="bg-brand-card rounded-[10px] border border-brand-border p-3 flex gap-3 items-center"
                  >
                    {o.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={o.foto_url}
                        alt={"Foto de " + o.nome}
                        className="w-[40px] h-[40px] rounded-lg object-cover shrink-0 border border-brand-border"
                      />
                    ) : (
                      <div className="w-[40px] h-[40px] rounded-lg bg-brand-surface flex items-center justify-center text-[12px] font-extrabold text-brand-red shrink-0 border border-brand-border">
                        {iniciais(o.nome)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[14px] truncate">{o.nome}</div>
                      <div className="text-[12px] text-brand-red font-bold truncate">
                        {oServicos[0]?.servico || ""}
                      </div>
                    </div>
                    <span className="text-brand-grey-light text-[13px]">→</span>
                  </Link>
                );
              })}
            </div>
            <div className="text-right mt-4">
              <Link
                href={"/catalogo?cat=" + encodeURIComponent(categoriaPrincipal)}
                className="text-[12px] font-bold text-brand-grey"
              >
                Ver todos em {CIDADE} →
              </Link>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
