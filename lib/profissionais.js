// Acesso aos dados de profissionais no servidor (Server Components).
// Usa o cliente Supabase com a anon key — a leitura é pública (RLS), então
// funciona igual no servidor, permitindo renderizar o perfil já preenchido
// (indexável), diferente do catálogo que busca no browser.

import { supabase } from "./supabase";

// Busca um profissional pelo id. Retorna null quando não existe (ou id inválido).
export async function getProfissional(id) {
  if (!id) return null;
  const { data, error } = await supabase
    .from("profissionais")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data || null;
}

// Busca as avaliações de um profissional, mais recentes primeiro.
export async function getAvaliacoesDe(id) {
  if (!id) return [];
  const { data } = await supabase
    .from("avaliacoes")
    .select("*")
    .eq("profissional_id", id)
    .order("criado_em", { ascending: false });
  return data || [];
}

// Lista id + data de criação de todos os profissionais, para o sitemap.xml.
// Mais recentes primeiro; `criado_em` vira o lastModified de cada perfil.
export async function listProfissionaisIds() {
  const { data } = await supabase
    .from("profissionais")
    .select("id, criado_em")
    .order("criado_em", { ascending: false });
  return data || [];
}

// Retorna contagem de profissionais e avaliações para prova social na home.
// Duas queries paralelas de COUNT(*) — leves e rápidas.
export async function getContadores() {
  const [{ count: profissionais }, { count: avaliacoes }] = await Promise.all([
    supabase.from("profissionais").select("*", { count: "exact", head: true }),
    supabase.from("avaliacoes").select("*", { count: "exact", head: true }),
  ]);
  return { profissionais: profissionais ?? 0, avaliacoes: avaliacoes ?? 0 };
}

// Busca outros profissionais da mesma categoria (exceto o próprio), para o bloco
// "outros profissionais de [categoria]" que mantém o visitante navegando.
export async function getOutrosDaCategoria(categoria, exceptId, limite = 4) {
  if (!categoria) return [];
  const { data } = await supabase
    .from("profissionais")
    .select("*")
    .eq("categoria", categoria)
    .neq("id", exceptId)
    .order("criado_em", { ascending: false })
    .limit(limite);
  return data || [];
}
