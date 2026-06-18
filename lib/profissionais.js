// Acesso aos dados de profissionais no servidor (Server Components).
import { supabase } from "./supabase";

const SELECT_COMPLETO = "*, profissional_servicos(id, servico, categoria, ordem, descricao, instagram)";

function sortServicos(prof) {
  if (!prof) return prof;
  return {
    ...prof,
    profissional_servicos: (prof.profissional_servicos || []).sort((a, b) => a.ordem - b.ordem),
  };
}

// Busca um profissional pelo id. Retorna null quando não existe (ou id inválido).
export async function getProfissional(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from("profissionais")
    .select(SELECT_COMPLETO)
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
