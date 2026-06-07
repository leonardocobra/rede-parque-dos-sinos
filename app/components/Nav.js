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
    <nav style={{
      position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)",
      padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52,
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 800 }}>PS</div>
        <span style={{ fontFamily: "var(--display)", fontSize: 17 }}>Parque dos Sinos</span>
      </Link>
      <div style={{ display: "flex", gap: 2 }}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} style={{
            background: path === l.href ? "var(--black)" : "transparent",
            color: path === l.href ? "#fff" : "var(--grey)",
            borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 700,
          }}>{l.label}</Link>
        ))}
      </div>
    </nav>
  );
}
