import { listProfissionaisIds } from "../lib/profissionais";
import { absUrl } from "../lib/site";

// Sitemap dinâmico: páginas estáticas indexáveis + todos os perfis públicos.
// Acelera a indexação dos perfis pelo Google em vez de depender só do crawl.
// Revalidado periodicamente para incluir cadastros novos.
export const revalidate = 3600;

// Páginas públicas estáticas (rotas autenticadas como /painel e /entrar ficam de fora).
const ESTATICAS = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/catalogo", priority: 0.9, changeFrequency: "daily" },
  { path: "/cadastro", priority: 0.6, changeFrequency: "monthly" },
  { path: "/avaliar", priority: 0.5, changeFrequency: "monthly" },
  { path: "/sobre", priority: 0.4, changeFrequency: "monthly" },
];

export default async function sitemap() {
  const agora = new Date();

  const estaticas = ESTATICAS.map((p) => ({
    url: absUrl(p.path),
    lastModified: agora,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const profissionais = await listProfissionaisIds();
  const perfis = profissionais.map((p) => ({
    url: absUrl(`/profissional/${p.id}`),
    lastModified: p.criado_em ? new Date(p.criado_em) : agora,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...estaticas, ...perfis];
}
