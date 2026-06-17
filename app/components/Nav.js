"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { BRAND } from "../brand";
import { getBrowserSupabase } from "../../lib/supabase/client";

const links = [
  { href: "/", label: "Início" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/cadastro", label: "Cadastrar" },
  { href: "/sobre", label: "Sobre" },
];

export default function Nav() {
  const path = usePathname();
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getSession().then(({ data }) => setLogado(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLogado(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const authLink = logado
    ? { href: "/painel", label: "Painel" }
    : { href: "/entrar", label: "Entrar" };
  return (
    <nav className="sticky top-0 z-[100] bg-brand-card border-b border-brand-border px-3 flex items-center justify-between h-[52px] gap-1">
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-[6px] bg-brand-red flex items-center justify-center text-[11px] text-white font-extrabold">
          {BRAND.sigla}
        </div>
        <span className="font-mono font-extrabold text-[15px] whitespace-nowrap hidden min-[400px]:inline">
          a_rede.
        </span>
      </Link>
      <div className="flex items-center gap-0.5 shrink-0">
        {[...links, authLink].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-[6px] px-2 py-1.5 text-[11px] font-bold ${
              path === l.href ? "bg-brand-black text-white" : "bg-transparent text-brand-grey"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <ThemeToggle />
      </div>
    </nav>
  );
}
