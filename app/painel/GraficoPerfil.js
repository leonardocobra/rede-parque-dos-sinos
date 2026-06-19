// Gráfico de tendência diária para o /painel do dono: 2 séries (views de
// perfil e cliques de contato). SVG inline, sem libs, cores via CSS vars.
//   serie: [{ dia: "YYYY-MM-DD", perfilViews, contatos }]

const SERIES = [
  { key: "perfilViews", label: "Views de perfil", cor: "var(--grey)", id: "gpv" },
  { key: "contatos", label: "Cliques no contato", cor: "var(--red)", id: "gct" },
];

function ddmm(dia) {
  const [, m, d] = (dia || "").split("-");
  return d && m ? `${d}/${m}` : dia;
}

export default function GraficoPerfil({ serie = [] }) {
  const n = serie.length;
  if (n === 0) return null;

  const W = 480;
  const H = 130;
  const padL = 24;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(1, ...serie.flatMap((p) => [p.perfilViews, p.contatos]));
  const x = (i) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => padT + innerH - (v / max) * innerH;
  const baseY = padT + innerH;

  const xLabels = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Gráfico de tendência diária de views de perfil e cliques no contato"
      className="block"
    >
      <defs>
        {SERIES.map((s) => (
          <linearGradient key={s.id} id={s.id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.cor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={s.cor} stopOpacity="0.02" />
          </linearGradient>
        ))}
      </defs>

      <line x1={padL} y1={padT} x2={padL} y2={baseY} stroke="var(--border)" />
      <line x1={padL} y1={baseY} x2={W - padR} y2={baseY} stroke="var(--border)" />
      <text x={padL - 5} y={padT + 4} fontSize="9" textAnchor="end" fill="var(--grey-light)">
        {max}
      </text>
      <text x={padL - 5} y={baseY} fontSize="9" textAnchor="end" fill="var(--grey-light)">
        0
      </text>

      {SERIES.map((s) => {
        const pts = serie.map((p, i) => `${x(i)},${y(p[s.key])}`);
        const linha = `M${pts.join(" L")}`;
        const area = `M${x(0)},${baseY} L${pts.join(" L")} L${x(n - 1)},${baseY} Z`;
        return (
          <g key={s.key}>
            <path d={area} fill={`url(#${s.id})`} stroke="none" />
            <path d={linha} fill="none" stroke={s.cor} strokeWidth="1.8" strokeLinejoin="round" />
          </g>
        );
      })}

      {xLabels.map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 5}
          fontSize="8"
          textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
          fill="var(--grey-light)"
        >
          {ddmm(serie[i].dia)}
        </text>
      ))}
    </svg>
  );
}
