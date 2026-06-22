// Lógica das páginas locais serviço × bairro.
// Serviço e bairro são texto livre; resolvemos por slug comparando
// slugify(servico)/slugify(bairro), o que absorve variações de caixa/acento.
import { getAllProfissionais } from "./profissionais";
import { slugify } from "./slug";

// Deriva as combinações serviço×bairro reais (com ≥1 profissional) a partir
// de uma lista de profissionais. Dedup por servicoSlug/localSlug, mantendo o
// primeiro rótulo visto. Função pura — testável sem banco.
export function combosServicoBairro(profs) {
  const map = new Map();
  for (const p of profs || []) {
    if (!p || !p.bairro) continue;
    const localSlug = slugify(p.bairro);
    if (!localSlug) continue;
    for (const s of p.profissional_servicos || []) {
      if (!s || !s.servico) continue;
      const servicoSlug = slugify(s.servico);
      if (!servicoSlug) continue;
      const key = `${servicoSlug}/${localSlug}`;
      if (!map.has(key)) {
        map.set(key, {
          servicoSlug,
          localSlug,
          servico: s.servico,
          bairro: p.bairro,
          categoria: s.categoria,
        });
      }
    }
  }
  return [...map.values()];
}

// Resolve uma combinação serviço×bairro a partir dos slugs e lista os
// profissionais correspondentes. Retorna null quando não há nenhum.
// Função pura — testável sem banco.
export function filtrarPorServicoBairro(profs, servicoSlug, localSlug) {
  const matches = (profs || []).filter(
    (p) =>
      p &&
      p.bairro &&
      slugify(p.bairro) === localSlug &&
      (p.profissional_servicos || []).some((s) => s.servico && slugify(s.servico) === servicoSlug)
  );
  if (matches.length === 0) return null;
  const servico = matches[0].profissional_servicos.find(
    (s) => s.servico && slugify(s.servico) === servicoSlug
  )?.servico;
  return { servico, bairro: matches[0].bairro, profissionais: matches };
}

// Lista todas as combinações serviço×bairro reais (para sitemap e static params).
export async function listServicoBairroCombos() {
  const profs = await getAllProfissionais();
  return combosServicoBairro(profs);
}

// Carrega a combinação serviço×bairro (rótulos + profissionais), ou null.
export async function getServicoBairro(servicoSlug, localSlug) {
  const profs = await getAllProfissionais();
  return filtrarPorServicoBairro(profs, servicoSlug, localSlug);
}
