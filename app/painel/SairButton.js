"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "../../lib/supabase/client";

export default function SairButton() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    setSaindo(true);
    await getBrowserSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      disabled={saindo}
      className="rounded-[6px] px-3 py-1.5 text-[11px] font-bold bg-brand-surface text-brand-grey border border-brand-border shrink-0"
    >
      {saindo ? "Saindo..." : "Sair"}
    </button>
  );
}
