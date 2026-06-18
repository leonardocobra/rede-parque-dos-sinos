// Captura de eventos para a camada de analytics (tabela `eventos`).
// Espelha, no nosso Supabase, os sinais que hoje vão só para o Vercel Analytics
// — porque o painel /admin (fase 1) e o analytics por profissional (fase 2)
// precisam consultar esses dados por SQL. Ver docs/observabilidade-spec.md.
//
// Princípios:
//   • Anônimo: nada de PII. `sessao_id` é um id efêmero por visita.
//   • Best-effort: registrar evento NUNCA pode quebrar a navegação.
//   • Atribuição de primeira visita (first-touch) fixada por sessão.
import { getBrowserSupabase } from "./supabase/client";

// --- Helpers puros (testáveis sem browser) ----------------------------------

// Extrai os campos utm_* de uma query string (com ou sem "?" inicial).
export function parseUtm(search = "") {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const get = (k) => {
    const v = (params.get(k) || "").trim();
    return v ? v.slice(0, 120) : null; // limita tamanho; vazio vira null
  };
  return {
    utm_source: get("utm_source"),
    utm_medium: get("utm_medium"),
    utm_campaign: get("utm_campaign"),
  };
}

// Deriva o canal de origem a partir do referrer da entrada.
// `host` é o domínio do próprio site (para distinguir tráfego interno).
// Vocabulário alinhado à spec: instagram | busca | compartilhado | direto | <host externo>.
export function derivarOrigem(referrer = "", host = "") {
  if (!referrer) return "direto";
  let ref;
  try {
    ref = new URL(referrer);
  } catch {
    return "direto";
  }
  const h = ref.hostname.toLowerCase();

  // Navegação interna (mesmo domínio) não troca a origem da sessão.
  if (host && h.endsWith(host.toLowerCase())) return null;

  if (/(^|\.)instagram\.com$/.test(h) || h === "l.instagram.com") return "instagram";
  if (/(^|\.)(google|bing|yahoo|duckduckgo|ecosia)\./.test(h)) return "busca";
  if (
    h === "t.co" ||
    /(^|\.)(wa\.me|whatsapp\.com|facebook\.com|m\.facebook\.com|t\.me|telegram\.org)$/.test(h)
  ) {
    return "compartilhado";
  }
  return h; // outro domínio externo: guarda o host como origem
}

// --- Estado de sessão (browser) ---------------------------------------------

const CHAVE_ATRIB = "arede_atrib";

function novoId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // ignora
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Atribuição de primeira visita, persistida na sessão (sessionStorage).
// Garante que todos os eventos de uma visita compartilhem sessao_id/origem/UTM.
export function capturarAtribuicao() {
  if (typeof window === "undefined") return null;
  try {
    const salvo = sessionStorage.getItem(CHAVE_ATRIB);
    if (salvo) return JSON.parse(salvo);
  } catch {
    // sessionStorage indisponível — segue sem persistir.
  }

  const utm = parseUtm(window.location.search);
  const origemRef = derivarOrigem(document.referrer, window.location.hostname);
  // UTM tem precedência sobre o referrer como rótulo de canal.
  const origem = utm.utm_source || origemRef || "direto";

  const atrib = { sessao_id: novoId(), origem, ...utm };
  try {
    sessionStorage.setItem(CHAVE_ATRIB, JSON.stringify(atrib));
  } catch {
    // ignora
  }
  return atrib;
}

// --- Registro de evento ------------------------------------------------------

// Registra um evento na tabela `eventos`. Best-effort e silencioso.
// tipo: page_view | profile_view | contact_click | funnel_step
// dados: { profissional_id?, rota?, etapa?, canal? }
export function registrarEvento(tipo, dados = {}) {
  if (typeof window === "undefined") return;
  const atrib = capturarAtribuicao() || {};
  const payload = {
    tipo,
    profissional_id: dados.profissional_id ?? null,
    rota: dados.rota ?? window.location.pathname,
    etapa: dados.etapa ?? null,
    canal: dados.canal ?? null,
    origem: atrib.origem ?? null,
    utm_source: atrib.utm_source ?? null,
    utm_medium: atrib.utm_medium ?? null,
    utm_campaign: atrib.utm_campaign ?? null,
    sessao_id: atrib.sessao_id ?? null,
  };
  // O builder do supabase-js é "thenable" mas não expõe `.catch`; embrulhamos
  // num Promise real (mesmo padrão de PerfilView) para nunca estourar erro.
  Promise.resolve(getBrowserSupabase().from("eventos").insert(payload)).catch(() => {});
}
