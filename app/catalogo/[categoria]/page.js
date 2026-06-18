import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import { CATS, catIcon } from "../../config";
import { slugParaCategoria, categoriaParaSlug } from "../../../lib/categorias";
import { getProfissionaisDaCategoria } from "../../../lib/profissionais";
import { iniciais } from "../../../lib/avatar";

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

  return (
    <>
      <Nav />
      <div className="px-5 max-w-[560px] mx-auto pt-5 pb-10">
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
          <div className="space-y-2.5">
            {profissionais.map((p) => {
              const ini = iniciais(p.nome);
              return (
                <Link
                  key={p.id}
                  href={`/profissional/${p.id}`}
                  className="bg-brand-card rounded-[10px] border border-brand-border p-4 flex gap-3.5 items-start block"
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
                      {p.verificado && (
                        <span className="bg-brand-black text-white font-bold text-[10px] px-2.5 py-[3px] rounded-[4px] uppercase tracking-[0.6px] inline-flex items-center gap-1">
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
                  </div>
                  <span className="text-brand-grey-light text-[13px] shrink-0 mt-1">→</span>
                </Link>
              );
            })}
          </div>
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
