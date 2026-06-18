"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "../../lib/supabase/client";

// Vínculo automático pós-cadastro (P0.3). Quando o profissional cria conta logo
// após o cadastro, o id do cadastro fica em localStorage ("cadastro_pendente").
// Ao cair no /painel já logado, este componente reivindica esse cadastro
// (user_id = auth.uid()), reusando a RLS de claim (UPDATE só de linha órfã).
// Roda uma vez, limpa a chave e atualiza a página para o card aparecer.
export default function ClaimPendente() {
  const router = useRouter();
  const [vinculando, setVinculando] = useState(false);

  useEffect(() => {
    let pendente = null;
    try {
      pendente = localStorage.getItem("cadastro_pendente");
    } catch {
      // localStorage indisponível — nada a reivindicar automaticamente.
    }
    if (!pendente) return;

    (async () => {
      setVinculando(true);
      const supabase = getBrowserSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // A RLS de claim só permite quando user_id IS NULL; se o cadastro já
        // tiver dono, o update não casa nenhuma linha (inofensivo).
        await supabase
          .from("profissionais")
          .update({ user_id: user.id })
          .eq("id", pendente)
          .is("user_id", null);
      }
      // Limpa sempre: tendo vinculado ou não, não tenta de novo.
      try {
        localStorage.removeItem("cadastro_pendente");
      } catch {
        // ignora
      }
      router.refresh();
      setVinculando(false);
    })();
  }, [router]);

  if (!vinculando) return null;
  return (
    <p className="text-[13px] text-brand-grey-light mb-4">Vinculando seu cadastro recém-criado…</p>
  );
}
