import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../components/features/Nav";
import Footer from "../../components/features/Footer";
import CardProfissional from "../../components/features/CardProfissional";
import { CATS } from "../../config";
import { slugParaCategoria, categoriaParaSlug } from "../../../lib/categorias";
import { getProfissionaisDaCategoria } from "../../../lib/profissionais";
import { catalogoItemListJsonLd } from "../../../lib/perfil";
import { combosServicoBairro } from "../../../lib/local";
import { absUrl } from "../../../lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  return CATS.map((c) => ({ categoria: categoriaParaSlug(c.value) }));
}

export async function generateMetadata({ params }) {
  const nome = slugParaCategoria(params.categoria);
  if (!nome) return { title: "Categoria não encontrada · A Rede" };
  const cat = CATS.find((c) => c.value === nome);
  const exemplo = cat?.ex?.split(",")[0].trim() || nome;
  const title = `${exemplo}s em Jacareí · A Rede`;
  const description = `Encontre profissionais de ${nome} em Jacareí. Catálogo gratuito com avaliações da comunidade — A Rede.`;
  const url = `/catalogo/${params.categoria}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

export default async function PaginaCategoria({ params }) {
  const nome = slugParaCategoria(params.categoria);
  if (!nome) notFound();

  const profissionais = await getProfissionaisDaCategoria(nome);
  const cat = CATS.find((c) => c.value === nome);
  const jsonLd = catalogoItemListJsonLd(
    profissionais,
    absUrl(`/catalogo/${params.categoria}`),
    absUrl("/profissional")
  );
  // Links locais serviço×bairro desta categoria (descoberta a partir da categoria).
  const locais = combosServicoBairro(profissionais).filter((c) => c.categoria === nome);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Nav />
      <div className="px-5 max-w-[560px] md:max-w-[940px] mx-auto pt-5 pb-10">
        <Link href="/catalogo" className="text-[12px] text-brand-grey-light font-bold">
          ← Catálogo
        </Link>

        <header className="mt-4 mb-5">
          <div className="text-[28px] mb-1">{cat?.icon}</div>
          <h1 className="font-display text-[26px] leading-tight">{nome}</h1>
          <p className="text-[13px] text-brand-grey-light mt-1">
            {profissionais.length} {profissionais.length === 1 ? "profissional" : "profissionais"}{" "}
            em Jacareí
          </p>
        </header>

        {profissionais.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[32px] mb-2 opacity-40">📋</div>
            <div className="text-sm font-bold text-brand-grey">
              Nenhum profissional cadastrado nessa categoria ainda
            </div>
            <Link
              href="/cadastro"
              className="inline-block mt-4 bg-brand-red text-white rounded-lg px-6 py-2.5 text-[13px] font-bold"
            >
              Seja o primeiro
            </Link>
          </div>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2 md:items-start">
            {profissionais.map((p) => (
              <CardProfissional key={p.id} prof={p} />
            ))}
          </div>
        )}

        {locais.length > 0 && (
          <nav aria-label="Páginas por serviço e bairro" className="mt-8">
            <h2 className="text-[10px] font-extrabold tracking-[2px] uppercase text-brand-grey-light mb-3">
              Busca por bairro
            </h2>
            <div className="flex flex-wrap gap-2">
              {locais.map((c) => (
                <Link
                  key={`${c.servicoSlug}/${c.localSlug}`}
                  href={`/servico/${c.servicoSlug}/${c.localSlug}`}
                  className="bg-brand-surface border border-brand-border rounded-[6px] px-3 py-[6px] text-[12px] text-brand-grey font-bold"
                >
                  {c.servico} no {c.bairro}
                </Link>
              ))}
            </div>
          </nav>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/cadastro"
            className="bg-brand-red text-white rounded-lg px-8 py-3 text-sm font-bold inline-block"
          >
            + Cadastrar Meu Serviço
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
