// Helpers puros de telefone — sem React/Supabase, testáveis isoladamente.
//
// Motivação: o telefone é salvo no cadastro como texto cru digitado pelo
// profissional (ex.: "12981034707", "(12) 98103-4707", "12 98103-4707").
// Qualquer comparação literal entre o que o usuário digita na busca e o que
// está salvo falha por diferença de formatação. A regra é simples: compare
// sempre só os dígitos.

// Remove tudo que não for dígito.
export function soDigitos(valor) {
  return (valor || "").replace(/\D/g, "");
}

// Verdadeiro quando os dígitos do telefone salvo contêm os dígitos buscados.
// Ignora espaços, traços, parênteses e o "+" do DDI dos dois lados.
export function telefoneCombina(telefoneSalvo, termoBusca) {
  const termo = soDigitos(termoBusca);
  if (!termo) return false;
  return soDigitos(telefoneSalvo).includes(termo);
}

// Filtra uma lista de cadastros pelos dígitos do telefone buscado.
export function filtrarPorTelefone(cadastros, termoBusca) {
  if (!soDigitos(termoBusca)) return [];
  return (cadastros || []).filter((c) => telefoneCombina(c?.telefone, termoBusca));
}
