"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registrarEvento } from "../../lib/eventos";

// Registra um `page_view` na tabela `eventos` a cada mudança de rota.
// Vive no layout raiz; não renderiza nada e é best-effort (ver lib/eventos.js).
// A origem/UTM da visita é capturada uma vez por sessão dentro de registrarEvento.
export default function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    registrarEvento("page_view", { rota: pathname });
  }, [pathname]);
  return null;
}
