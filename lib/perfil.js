// Helpers puros do perfil público do profissional.
// Sem React/Supabase — testáveis de forma isolada.

export const CIDADE = "Jacareí";

const DESCRICAO_MAX = 160;

// Retorna o primeiro serviço listado (ordem=0) como string.
export function servicoPrimario(prof) {
  return prof?.profissional_servicos?.[0]?.servico || "";
}

// Retorna a categoria do primeiro serviço.
export function categoriaPrimaria(prof) {
  return prof?.profissional_servicos?.[0]?.categoria || "";
}

// Monta o rótulo "Nome — Serviço", mas SEM repetir o serviço quando o nome do
// negócio já o contém (ex.: "Doce Sabão Lavanderia" + serviço "Lavanderia" →
// "Doce Sabão Lavanderia", não "Doce Sabão Lavanderia — Lavanderia").
export function nomeComServico(nome, servico) {
  if (!servico) return nome || "";
  if ((nome || "").toLowerCase().includes(servico.toLowerCase())) return nome;
  return `${nome} — ${servico}`;
}

// Título da aba / SEO: "Nome — Serviço em Jacareí · A Rede".
export function tituloPerfil(prof) {
  if (!prof || !prof.nome) return "Profissional · A Rede";
  return `${nomeComServico(prof.nome, servicoPrimario(prof))} em ${CIDADE} · A Rede`;
}

// Meta description do perfil. Lidera pela bio (informação nova) — o card de
// preview já mostra nome/serviço/local na imagem e no título, então repeti-los
// aqui é desperdício. Sem bio, cai no "Nome — Serviço em Local" (mantém o SEO).
export function descricaoPerfil(prof) {
  if (!prof || !prof.nome) return "Profissional de confiança na Rede.";
  // Bio geral tem prioridade; sem ela, usa a descrição do serviço principal.
  const extra =
    (prof.descricao || "").trim() || (prof.profissional_servicos?.[0]?.descricao || "").trim();
  const local = prof.bairro ? `${prof.bairro}, ${CIDADE}` : CIDADE;
  const base = `${nomeComServico(prof.nome, servicoPrimario(prof))} em ${local}.`;
  const txt = extra || `${base} Profissional indicado por vizinhos na Rede.`;
  return txt.length > DESCRICAO_MAX ? txt.slice(0, DESCRICAO_MAX - 1).trimEnd() + "…" : txt;
}

// Monta o link do WhatsApp a partir do telefone.
export function whatsappLink(telefone) {
  const n = (telefone || "").replace(/\D/g, "");
  return n ? "https://wa.me/55" + n : null;
}

// Monta o JSON-LD (schema.org) do perfil para dados estruturados.
export function perfilJsonLd(prof, stats, url) {
  if (!prof || !prof.nome) return null;
  const servicos = prof.profissional_servicos || [];
  const ld = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: prof.nome,
    description: descricaoPerfil(prof),
    url,
    areaServed: prof.regioes || CIDADE,
    knowsAbout: servicos.map((s) => s.servico).join(", ") || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: CIDADE,
      addressRegion: "SP",
      addressCountry: "BR",
    },
  };
  if (prof.foto_url) ld.image = prof.foto_url;
  if (stats && stats.count > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: stats.avg,
      reviewCount: stats.count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return ld;
}

// Filtra outros profissionais que compartilham ao menos uma categoria com a dada.
export function filtrarOutros(profs, categoria, exceptId, limite = 4) {
  if (!categoria) return [];
  return (profs || [])
    .filter(
      (p) =>
        p &&
        p.id !== exceptId &&
        (p.profissional_servicos || []).some((s) => s.categoria === categoria)
    )
    .slice(0, limite);
}
