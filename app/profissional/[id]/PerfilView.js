"use client";
import { useEffect } from "react";
import { track } from "@vercel/analytics";

// Dispara o evento de visualização de perfil uma vez, no mount.
// Métrica-norte do doc de crescimento: "visualizações de perfil".
// Não renderiza nada — a página permanece server-rendered (indexável);
// só este trecho hidrata para registrar a métrica.
export default function PerfilView({ id, nome }) {
  useEffect(() => {
    track("perfil_view", { id, nome });
  }, [id, nome]);
  return null;
}
