// Helpers de conversão entre nomes de categoria e slugs de URL.
// Ex.: "Construção e Reforma" <-> "construcao-e-reforma"

import { CATS } from "../app/config";

// Converte um nome de categoria para slug kebab-case sem acentos.
export function categoriaParaSlug(nome) {
  return (nome || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Resolve um slug de volta ao nome original da categoria (ou null se não existe).
export function slugParaCategoria(slug) {
  if (!slug) return null;
  const normalizado = categoriaParaSlug(slug);
  const encontrado = CATS.find((c) => categoriaParaSlug(c.value) === normalizado);
  return encontrado ? encontrado.value : null;
}
