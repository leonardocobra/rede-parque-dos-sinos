// Geração de links com UTM para divulgação por canal.
// Resolve o ponto fraco da atribuição: o Instagram (e outros apps) costuma
// abrir links sem `referrer`, então um link puro vira "direto". Com utm_source
// explícito a origem é contada certo — e o utm_source tem precedência sobre o
// referrer na captura (ver lib/eventos.js). Ver docs/observabilidade-spec.md.

// Canais que o profissional divulga, com o utm_source correspondente.
// O `source` precisa casar com o vocabulário de origem do /admin.
export const CANAIS_DIVULGACAO = [
  { id: "instagram", rotulo: "Instagram (bio/post)", source: "instagram" },
  { id: "status", rotulo: "Status / Stories", source: "status" },
  { id: "whatsapp", rotulo: "WhatsApp", source: "whatsapp" },
  { id: "facebook", rotulo: "Facebook", source: "facebook" },
];

// Acrescenta utm_source (e opcionalmente medium/campaign) a uma URL absoluta,
// preservando a query existente e sem duplicar parâmetros.
export function adicionarUtm(url, source, { medium, campaign } = {}) {
  if (!source) return url;
  const u = new URL(url);
  u.searchParams.set("utm_source", source);
  if (medium) u.searchParams.set("utm_medium", medium);
  if (campaign) u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}
