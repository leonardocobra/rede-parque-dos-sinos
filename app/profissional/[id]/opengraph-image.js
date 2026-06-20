import { ImageResponse } from "next/og";
import { getProfissional, getAvaliacoesDe } from "../../../lib/profissionais";
import { computeStats } from "../../../lib/catalogo";
import { iniciais } from "../../../lib/avatar";
import { servicoPrimario, nomeComServico } from "../../../lib/perfil";

// Imagem de preview (OG) por perfil — o link compartilhado no WhatsApp puxa
// clique pela CARA e pelos sinais de confiança (foto real, nota, selos).
// Antes mostrava só as iniciais num quadrado: rosto = confiança numa indicação.
export const runtime = "edge";
export const alt = "Perfil na Rede";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RED = "#d11525";
const INK = "#0a0a0a";

// Glyphs como SVG inline: ✓ e ★ podem virar "tofu" na fonte do next/og.
function CheckSvg({ color }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function StarSvg({ color }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill={color}>
      <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.401 8.168L12 18.897l-7.335 3.866 1.401-8.168L.132 9.211l8.2-1.193z" />
    </svg>
  );
}

function Pill({ bg, color, icon, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: bg,
        color,
        fontSize: "28px",
        fontWeight: 700,
        padding: "12px 22px",
        borderRadius: "14px",
      }}
    >
      {icon}
      {children}
    </div>
  );
}

export default async function Image({ params }) {
  const prof = await getProfissional(params.id);
  const nome = prof?.nome || "Profissional";
  const servico = prof ? servicoPrimario(prof) : "";
  // Não mostra a linha do serviço quando o nome do negócio já o contém
  // (ex.: "Doce Sabão Lavanderia" + "Lavanderia").
  const mostrarServico = servico && nomeComServico(nome, servico) !== nome;
  const foto = prof?.foto_url || null;

  // Nota e selo de recomendação são fortes gatilhos de clique numa indicação.
  const avals = prof ? await getAvaliacoesDe(params.id) : [];
  const st = prof ? computeStats(params.id, avals) : null;
  const nota = st ? st.avg.toFixed(1).replace(".", ",") : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      {/* Miolo: foto à esquerda, identidade + sinais de confiança à direita */}
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          padding: "72px",
          gap: "56px",
        }}
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            width={300}
            height={300}
            alt=""
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "36px",
              objectFit: "cover",
              border: "4px solid #f0f0f0",
            }}
          />
        ) : (
          <div
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "36px",
              background: RED,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "120px",
              fontWeight: 800,
            }}
          >
            {iniciais(nome)}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              display: "flex",
              fontSize: "62px",
              fontWeight: 800,
              color: INK,
              lineHeight: 1.05,
            }}
          >
            {nome}
          </div>
          {mostrarServico && (
            <div
              style={{
                display: "flex",
                fontSize: "38px",
                fontWeight: 700,
                color: RED,
                marginTop: "14px",
              }}
            >
              {servico}
            </div>
          )}
          <div style={{ display: "flex", gap: "16px", marginTop: "30px", flexWrap: "wrap" }}>
            {st?.recomendado && (
              <Pill bg="#fbe9ea" color={RED}>
                Recomendado
              </Pill>
            )}
            {prof?.verificado && (
              <Pill bg={INK} color="#ffffff" icon={<CheckSvg color="#ffffff" />}>
                Verificado
              </Pill>
            )}
            {nota && (
              <Pill bg="#f4f4f4" color={INK} icon={<StarSvg color={RED} />}>
                {nota} ({st.count})
              </Pill>
            )}
          </div>
        </div>
      </div>

      {/* Barra de marca: identifica A Rede e o contexto do bairro */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: RED,
          color: "#ffffff",
          padding: "30px 72px",
        }}
      >
        <div style={{ display: "flex", fontSize: "34px", fontWeight: 800 }}>A Rede</div>
        <div style={{ display: "flex", fontSize: "28px", fontWeight: 500, opacity: 0.92 }}>
          Profissionais de confiança · Parque dos Sinos
        </div>
      </div>
    </div>,
    { ...size }
  );
}
