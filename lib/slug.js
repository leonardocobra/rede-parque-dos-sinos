// Slugificador genérico: minúsculas, sem acentos, kebab-case.
// Base das URLs de categoria, serviço e bairro.
export function slugify(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
