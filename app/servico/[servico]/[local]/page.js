import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../../components/features/Nav";
import Footer from "../../../components/features/Footer";
import CardProfissional from "../../../components/features/CardProfissional";
import { getServicoBairro, listServicoBairroCombos } from "../../../../lib/local";
import { catalogoItemListJsonLd, CIDADE } from "../../../../lib/perfil";
import { absUrl } from "../../../../lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const combos = await listServicoBairroCombos();
  return combos.map((c) => ({ servico: c.servicoSlug, local: c.localSlug }));
}

export async function generateMetadata({ params }) {
  const dados = await getServicoBairro(params.servico, params.local);
  if (!dados) return { title: "Página não encontrada · A Rede" };
  const { servico, bairro } = dados;
  const title = `${servico} no ${bairro}, ${CIDADE} · A Rede`;
  const description = `Encontre ${servico} no ${bairro}, ${CIDADE}. Profissionais indicados por vizinhos, com avaliações da comunidade — A Rede.`;
  const url = `/servico/${params.servico}/${params.local}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

export default async function PaginaLocal({ params }) {
  const dados = await getServicoBairro(params.servico, params.local);
  if (!dados) notFound();

  const { servico, bairro, profissionais } = dados;
  const jsonLd = catalogoItemListJsonLd(
    profissionais,
    absUrl(`/servico/${params.servico}/${params.local}`),
    absUrl("/profissional")
  );

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
          <h1 className="font-display text-[26px] leading-tight">
            {servico} no {bairro}
          </h1>
          <p className="text-[13px] text-brand-grey mt-2 leading-relaxed">
            Encontre {servico} no {bairro}, {CIDADE}. {profissionais.length}{" "}
            {profissionais.length === 1 ? "profissional indicado" : "profissionais indicados"} por
            vizinhos, com avaliações da comunidade.
          </p>
        </header>

        <div className="grid gap-2.5 md:grid-cols-2 md:items-start">
          {profissionais.map((p) => (
            <CardProfissional key={p.id} prof={p} />
          ))}
        </div>

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
