// Acesso aos dados de profissionais no servidor (Server Components).
import { supabase } from "./supabase";
import { filtrarOutros } from "./perfil";

const SELECT_COMPLETO = "*, profissional_servicos(id, servico, categoria, ordem, descricao, instagram)";

// Seleção do perfil público traz também os itens de cada serviço. Separada do
// SELECT_COMPLETO (usado em listas de catálogo) para não puxar itens em telas
// que não os mostram.
const SELECT_PERFIL =
  "*, profissional_servicos(id, servico, categoria, ordem, descricao, instagram, profissional_itens(id, titulo, descricao, foto_url, preco, preco_tipo, disponibilidade, ativo, ordem))";

function sortServicos(prof) {
  if (!prof) return prof;
  return {
    ...prof,
    profissional_servicos: (prof.profissional_servicos || [])
      .sort((a, b) => a.ordem - b.ordem)
      // Quando os itens vierem (perfil): só os ativos, na ordem definida.
      .map((s) =>
        s.profissional_itens
          ? {
              ...s,
              profissional_itens: s.profissional_itens
                .filter((i) => i.ativo)
                .sort((a, b) => a.ordem - b.ordem),
            }
          : s
      ),
  };
}

// Busca um profissional pelo id. Retorna null quando não existe (ou id inválido).
export async function getProfissional(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from("profissionais")
    .select(SELECT_PERFIL)
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return sortServicos(data) || null;
}

// Busca as avaliações de um profissional, mais recentes primeiro.
// Inclui o serviço avaliado quando disponível (servico_id preenchido).
export async function getAvaliacoesDe(id) {
  if (!id) return [];
  const { data } = await supabase
    .from("avaliacoes")
    .select("*, profissional_servicos(servico)")
    .eq("profissional_id", id)
    .order("criado_em", { ascending: false });
  return data || [];
}

// Lista id + data de criação de todos os profissionais, para o sitemap.xml.
export async function listProfissionaisIds() {
  const { data } = await supabase
    .from("profissionais")
    .select("id, criado_em")
    .order("criado_em", { ascending: false });
  return data || [];
}

// Lista todos os profissionais de uma categoria (via profissional_servicos), mais recentes primeiro.
export async function getProfissionaisDaCategoria(categoria) {
  if (!categoria) return [];
  const { data: servicos } = await supabase
    .from("profissional_servicos")
    .select("profissional_id")
    .eq("categoria", categoria);

  const ids = [...new Set((servicos || []).map((s) => s.profissional_id))];
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("profissionais")
    .select(SELECT_COMPLETO)
    .in("id", ids)
    .order("criado_em", { ascending: false });

  return (data || []).map(sortServicos);
}

// Busca outros profissionais que compartilham ao menos uma categoria (exceto o próprio).
export async function getOutrosDaCategoria(categoria, exceptId, limite = 4) {
  if (!categoria) return [];
  const { data: servicos } = await supabase
    .from("profissional_servicos")
    .select("profissional_id")
    .eq("categoria", categoria);

  const ids = [...new Set((servicos || []).map((s) => s.profissional_id))].filter(
    (id) => id !== exceptId
  );
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("profissionais")
    .select(SELECT_COMPLETO)
    .in("id", ids)
    .order("criado_em", { ascending: false })
    .limit(limite);

  return (data || []).map(sortServicos);
}

// Busca os "outros da categoria" para VÁRIAS categorias de uma vez e devolve
// um map { categoria -> lista }. Faz uma única ida ao banco (todos os profs que
// têm ao menos uma das categorias) e fatia por categoria com `filtrarOutros`.
// Usado no perfil para que a seção "Outros" acompanhe o serviço selecionado nos
// chips sem refetch no cliente — mantendo a página server-rendered/indexável.
export async function getOutrosPorCategoria(categorias, exceptId, limite = 4) {
  const cats = [...new Set((categorias || []).filter(Boolean))];
  if (cats.length === 0) return {};

  const { data: servicos } = await supabase
    .from("profissional_servicos")
    .select("profissional_id")
    .in("categoria", cats);

  const ids = [...new Set((servicos || []).map((s) => s.profissional_id))].filter(
    (id) => id !== exceptId
  );
  if (ids.length === 0) return Object.fromEntries(cats.map((c) => [c, []]));

  const { data } = await supabase
    .from("profissionais")
    .select(SELECT_COMPLETO)
    .in("id", ids)
    .order("criado_em", { ascending: false });

  const profs = (data || []).map(sortServicos);
  return Object.fromEntries(cats.map((c) => [c, filtrarOutros(profs, c, exceptId, limite)]));
}
