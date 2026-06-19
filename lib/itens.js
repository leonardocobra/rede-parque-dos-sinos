// Helpers dos itens/subserviços do perfil (Frente 1a).
// Item pertence a um serviço (profissional_itens). Preço é sempre opcional;
// quando existe, vem com um tipo que muda como ele é apresentado.

// Teto de itens por serviço — espelha o trigger check_max_itens no banco.
export const MAX_ITENS = 20;

// Tipos de preço. `value` casa com o CHECK do banco; `label` é o texto exibido.
export const PRECO_TIPOS = [
  { value: "a_partir", label: "a partir de" },
  { value: "fixo", label: "fixo" },
  { value: "sob_orcamento", label: "sob orçamento" },
];

// Formata um número em reais sem depender de Intl (que insere espaço fixo e
// varia por ambiente): "R$ 1.234,56". Sempre 2 casas.
function brl(valor) {
  const [inteiro, decimal] = Math.abs(valor).toFixed(2).split(".");
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${comMilhar},${decimal}`;
}

// Texto de preço pronto para exibir, ou null quando não há nada a mostrar.
// - "sob_orcamento": ignora o valor e mostra "sob orçamento".
// - "a_partir": prefixa "a partir de" ao valor.
// - "fixo" (ou tipo ausente): só o valor.
// Sem preço e sem ser sob orçamento → null (degrada graciosamente).
export function formatarPreco(preco, precoTipo) {
  if (precoTipo === "sob_orcamento") return "sob orçamento";
  if (preco === null || preco === undefined || preco === "") return null;
  const valor = Number(preco);
  if (!Number.isFinite(valor)) return null;
  if (precoTipo === "a_partir") return `a partir de ${brl(valor)}`;
  return brl(valor);
}

// Linha-resumo do item (preço + disponibilidade), juntando só o que existe.
// Retorna "" quando o item não tem nem preço nem disponibilidade.
export function resumoItem(item) {
  const partes = [formatarPreco(item?.preco, item?.preco_tipo), item?.disponibilidade];
  return partes.filter(Boolean).join(" · ");
}

// Valida o item antes de salvar. Só o título é obrigatório.
export function validarItem(item) {
  if (!item || !item.titulo || !item.titulo.trim()) {
    return { ok: false, erro: "Dê um título ao item." };
  }
  return { ok: true };
}
