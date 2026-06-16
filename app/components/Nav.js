"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Início" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/cadastro", label: "Cadastrar" },
  { href: "/sobre", label: "Sobre" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-brand-border px-4 flex items-center justify-between h-[52px]">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-[6px] bg-brand-red flex items-center justify-center text-[11px] text-white font-extrabold">
          PS
        </div>
        <span className="font-display text-[17px]">Parque dos Sinos</span>
      </Link>
      <div className="flex gap-0.5">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-[6px] px-2.5 py-1.5 text-[11px] font-bold ${
              path === l.href ? "bg-brand-black text-white" : "bg-transparent text-brand-grey"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
