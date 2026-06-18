"use client";
import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { getBrowserSupabase } from "../../../lib/supabase/client";

// Dispara o registro de visualização de perfil uma vez, no mount.
// Métrica-norte do doc de crescimento: "visualizações de perfil".
// Não renderiza nada — a página permanece server-rendered (indexável);
// só este trecho hidrata para registrar a métrica.
//
// Registra em dois lugares: o evento `perfil_view` no Vercel Analytics
// (dashboard de produto) e o contador próprio no Supabase, que é a fonte
// simples de leitura para o número exibido no /painel do profissional.
export default function PerfilView({ id, nome }) {
  useEffect(() => {
    track("perfil_view", { id, nome });
    // Incremento best-effort: falha aqui nunca deve atrapalhar a página.
    // O builder do supabase-js é "thenable" mas não expõe `.catch`; por isso
    // envolvemos num Promise real antes de tratar o erro.
    Promise.resolve(getBrowserSupabase().rpc("incrementar_visualizacao", { p_id: id })).catch(
      () => {}
    );
  }, [id, nome]);
  return null;
}
