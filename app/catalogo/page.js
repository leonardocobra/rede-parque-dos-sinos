import Nav from "../components/features/Nav";
import Footer from "../components/features/Footer";
import CatalogoClient from "./CatalogoClient";
import { getAllProfissionais, getAllAvaliacoes } from "../../lib/profissionais";
import { catalogoItemListJsonLd } from "../../lib/perfil";
import { absUrl } from "../../lib/site";

export const revalidate = 60;

export const metadata = {
  title: "Catálogo de Profissionais em Jacareí · A Rede",
  description:
    "Encontre profissionais de confiança em Jacareí — manicure, diarista, encanador e muito mais. Catálogo gratuito com avaliações da comunidade.",
  alternates: { canonical: "/catalogo" },
  openGraph: {
    title: "Catálogo de Profissionais em Jacareí · A Rede",
    description:
      "Encontre profissionais de confiança em Jacareí — manicure, diarista, encanador e muito mais.",
    url: "/catalogo",
  },
};

export default async function Catalogo() {
  const [profs, avals] = await Promise.all([getAllProfissionais(), getAllAvaliacoes()]);
  const jsonLd = catalogoItemListJsonLd(profs, absUrl("/catalogo"), absUrl("/profissional"));
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Nav />
      <CatalogoClient initialProfs={profs} initialAvals={avals} />
      <Footer />
    </>
  );
}
