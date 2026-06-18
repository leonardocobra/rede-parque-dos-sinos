// Resolve a URL base do site para metadados absolutos (OG image, canonical,
// sitemap e robots). Sem ela, links de compartilhamento e o sitemap apontariam
// para caminhos relativos e quebrariam fora do próprio domínio.
//
// Ordem de resolução:
//   1. NEXT_PUBLIC_SITE_URL — domínio definitivo, configurado na Vercel.
//   2. VERCEL_URL — URL do deploy atual (preview/produção), injetada pela Vercel.
//   3. http://localhost:3000 — desenvolvimento local.

function semBarraFinal(u) {
  return u.replace(/\/+$/, "");
}

function comProtocolo(u) {
  return /^https?:\/\//.test(u) ? u : `https://${u}`;
}

// URL base sem barra no fim (ex.: "https://arede.com.br").
export function siteUrl() {
  const explicito = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicito) return semBarraFinal(comProtocolo(explicito));
  const vercel = process.env.VERCEL_URL;
  if (vercel) return semBarraFinal(comProtocolo(vercel));
  return "http://localhost:3000";
}

// URL absoluta para um caminho do site (ex.: absUrl("/profissional/1")).
export function absUrl(path = "/") {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${p}`;
}
