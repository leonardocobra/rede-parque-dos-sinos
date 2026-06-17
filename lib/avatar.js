// Helpers do avatar do profissional.

// Gera as iniciais (até 2 letras maiúsculas) a partir do nome, usadas como
// fallback quando o profissional não tem foto.
export function iniciais(nome) {
  return (nome || "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Extensões de imagem aceitas no upload de foto.
export const FOTO_EXTENSOES = ["jpg", "jpeg", "png", "webp"];

// Tamanho máximo da foto em bytes (2 MB) — mantém o upload leve no celular.
export const FOTO_TAMANHO_MAX = 2 * 1024 * 1024;

// Valida um arquivo de foto antes do upload. Retorna { ok } ou { ok, erro }.
export function validarFoto(file) {
  if (!file) return { ok: true }; // foto é opcional
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!FOTO_EXTENSOES.includes(ext)) {
    return { ok: false, erro: "Formato inválido. Use JPG, PNG ou WebP." };
  }
  if (file.size > FOTO_TAMANHO_MAX) {
    return { ok: false, erro: "Imagem muito grande. Máximo de 2 MB." };
  }
  return { ok: true };
}
