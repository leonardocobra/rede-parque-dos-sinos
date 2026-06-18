import { absUrl } from "../lib/site";

// robots.txt: libera o catálogo e os perfis para indexação e bloqueia as rotas
// privadas/autenticadas. Aponta para o sitemap dinâmico.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/painel", "/entrar", "/auth"],
    },
    sitemap: absUrl("/sitemap.xml"),
  };
}
