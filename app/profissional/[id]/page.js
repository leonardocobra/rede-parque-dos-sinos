import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import PerfilView from "./PerfilView";
import ContatoBotoes from "./ContatoBotoes";
import { getProfissional, getAvaliacoesDe, getOutrosPorCategoria } from "../../../lib/profissionais";
import { computeStats } from "../../../lib/catalogo";
import { iniciais } from "../../../lib/avatar";
import { instagramUrl } from "../../../lib/instagram";
import {
  tituloPerfil,
  descricaoPerfil,
  whatsappLink,
  perfilJsonLd,
  servicoPrimario,
  CIDADE,
} from "../../../lib/perfil";
import { absUrl } from "../../../lib/site";
import PerfilInterativo from "./PerfilInterativo";

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

  const servicos = prof.profissional_servicos || [];
  const categorias = [...new Set(servicos.map((s) => s.categoria))];
  const [avals, outrosPorCategoria] = await Promise.all([
    getAvaliacoesDe(id),
    getOutrosPorCategoria(categorias, id),
  ]);

  const st = computeStats(id, avals);
  const ini = iniciais(prof.nome);
  const wa = whatsappLink(prof.telefone);
  const ig = instagramUrl(prof.instagram);
  const comentarios = avals.filter((a) => (a.comentario || "").trim());
  const jsonLd = perfilJsonLd(prof, st, absUrl(`/profissional/${id}`));

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

        {/* Serviços + "Outros da categoria" sob um único estado client-side:
            ao trocar o serviço ativo nos chips, a seção "Outros" (no fim) passa a
            refletir a categoria daquele serviço. O miolo (bio, CTAs, comentários)
            vai como children e permanece server-rendered. */}
        <PerfilInterativo
          servicos={servicos}
          outrosPorCategoria={outrosPorCategoria}
          cidade={CIDADE}
        >
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
        </PerfilInterativo>
      </div>
      <Footer />
    </>
  );
}
