// Normaliza um valor de Instagram (handle, @handle ou URL) em uma URL de perfil.
// Aceita formatos variados pois o dado em profissionais.instagram não é padronizado.
// Retorna null quando não há um handle utilizável.
export function instagramUrl(value) {
  if (!value || typeof value !== "string") return null;

  let handle = value.trim();
  if (!handle) return null;

  // Remove protocolo e domínio se vier como URL completa.
  handle = handle.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  handle = handle.replace(/^instagram\.com\//i, "").replace(/^instagr\.am\//i, "");

  // Remove query string, fragmento e barras extras.
  handle = handle.split(/[?#]/)[0];
  handle = handle.replace(/^\/+/, "").replace(/\/+$/, "");

  // Remove @ inicial e espaços internos.
  handle = handle.replace(/^@+/, "").replace(/\s+/g, "");

  // Um handle válido do Instagram contém letras, números, ponto e underline.
  if (!handle || !/^[A-Za-z0-9._]+$/.test(handle)) return null;

  return "https://instagram.com/" + handle;
}
