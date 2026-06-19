// Gráfico de tendência (linha do tempo) das métricas de tráfego por dia.
// SVG inline, sem libs — uma linha por métrica, com a área abaixo sombreada
// por um gradiente da mesma cor (transparência média). Cores via CSS vars,
// então acompanha o tema claro/escuro. Componente puro de apresentação.
//   serie: [{ dia: "YYYY-MM-DD", visitas, perfilViews, contatos }]

const SERIES = [
  { key: "visitas", label: "Visitas", cor: "var(--text)", id: "gv" },
  { key: "perfilViews", label: "Views de perfil", cor: "var(--grey)", id: "gp" },
  { key: "contatos", label: "Contatos", cor: "var(--red)", id: "gc" },
];

// "YYYY-MM-DD" -> "DD/MM" sem depender de Date (evita deslocamento de fuso).
function ddmm(dia) {
  const [, m, d] = (dia || "").split("-");
  return d && m ? `${d}/${m}` : dia;
}

export default function GraficoTendencia({ serie = [] }) {
  const n = serie.length;
  if (n === 0) return null;

  // Geometria do desenho (coordenadas do viewBox).
  const W = 520;
  const H = 160;
  const padL = 28;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(1, ...serie.flatMap((p) => [p.visitas, p.perfilViews, p.contatos]));
  const x = (i) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => padT + innerH - (v / max) * innerH;
  const baseY = padT + innerH;

  // Rótulos do eixo X: primeiro, meio e último dia.
  const xLabels = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Gráfico de tendência diária de visitas, views de perfil e contatos"
      className="block"
    >
      <defs>
        {SERIES.map((s) => (
          <linearGradient key={s.id} id={s.id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.cor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={s.cor} stopOpacity="0.02" />
          </linearGradient>
        ))}
      </defs>

      {/* Eixos */}
      <line x1={padL} y1={padT} x2={padL} y2={baseY} stroke="var(--border)" />
      <line x1={padL} y1={baseY} x2={W - padR} y2={baseY} stroke="var(--border)" />
      <text x={padL - 6} y={padT + 4} fontSize="10" textAnchor="end" fill="var(--grey-light)">
        {max}
      </text>
      <text x={padL - 6} y={baseY} fontSize="10" textAnchor="end" fill="var(--grey-light)">
        0
      </text>

      {/* Áreas sombreadas + linhas, uma por série */}
      {SERIES.map((s) => {
        const pts = serie.map((p, i) => `${x(i)},${y(p[s.key])}`);
        const linha = `M${pts.join(" L")}`;
        const area = `M${x(0)},${baseY} L${pts.join(" L")} L${x(n - 1)},${baseY} Z`;
        return (
          <g key={s.key}>
            <path d={area} fill={`url(#${s.id})`} stroke="none" />
            <path d={linha} fill="none" stroke={s.cor} strokeWidth="2" strokeLinejoin="round" />
          </g>
        );
      })}

      {/* Rótulos do eixo X */}
      {xLabels.map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 6}
          fontSize="9"
          textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
          fill="var(--grey-light)"
        >
          {ddmm(serie[i].dia)}
        </text>
      ))}
    </svg>
  );
}
