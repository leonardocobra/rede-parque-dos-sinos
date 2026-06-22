import Nav from "../components/features/Nav";
import Footer from "../components/features/Footer";
import CatalogoClient from "./CatalogoClient";
import { getAllProfissionais, getAllAvaliacoes } from "../../lib/profissionais";

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
  return (
    <>
      <Nav />
      <CatalogoClient initialProfs={profs} initialAvals={avals} />
      <Footer />
    </>
  );
}
