import { ImageResponse } from "next/og";
import { getProfissional } from "../../../lib/profissionais";
import { iniciais } from "../../../lib/avatar";

// Imagem de preview (OG) por perfil — link bonito no WhatsApp/Instagram puxa
// clique (alavanca de compartilhamento do doc de crescimento).
export const runtime = "edge";
export const alt = "Perfil na Rede";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RED = "#d11525";
const INK = "#0a0a0a";

export default async function Image({ params }) {
  const prof = await getProfissional(params.id);
  const nome = prof?.nome || "Profissional";
  const servico = prof?.profissional_servicos?.[0]?.servico || "";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
        <div
          style={{
            width: "200px",
            height: "200px",
            borderRadius: "32px",
            background: RED,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "88px",
            fontWeight: 800,
          }}
        >
          {iniciais(nome)}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "64px", fontWeight: 800, color: INK }}>{nome}</div>
          {servico && (
            <div style={{ fontSize: "40px", fontWeight: 700, color: RED, marginTop: "8px" }}>
              {servico}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", fontSize: "32px", fontWeight: 700, color: "#6b6b6b" }}>
        A Rede · Profissionais de confiança em Jacareí
      </div>
    </div>,
    { ...size }
  );
}
