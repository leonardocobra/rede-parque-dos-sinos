"use client";
import { useEffect, useState } from "react";

// Alterna entre tema claro e escuro adicionando/removendo a classe .dark
// no <html> e persistindo a preferência. O estado inicial é definido pelo
// script anti-FOUC no layout, então aqui apenas sincronizamos no mount.
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch (e) {
      // localStorage indisponível — segue só com a troca visual
    }
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="w-8 h-8 rounded-[6px] border border-brand-border text-brand-grey flex items-center justify-center shrink-0"
    >
      {dark ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-5a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 17a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0l.7.7a1 1 0 01-1.41 1.42l-.71-.71a1 1 0 010-1.41zm12.73 12.73a1 1 0 011.41 0l.71.71a1 1 0 01-1.41 1.41l-.71-.7a1 1 0 010-1.42zM2 12a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm17 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4.22 19.78a1 1 0 010-1.41l.71-.71a1 1 0 011.41 1.41l-.7.71a1 1 0 01-1.42 0zM16.95 7.05a1 1 0 010-1.41l.71-.71a1 1 0 011.41 1.41l-.7.71a1 1 0 01-1.42 0z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M21.64 13a1 1 0 00-1.05-.14 8 8 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8 8 0 01.25-2A1 1 0 008 2.36 10.14 10.14 0 1022 14.05a1 1 0 00-.36-1.05z" />
        </svg>
      )}
    </button>
  );
}
