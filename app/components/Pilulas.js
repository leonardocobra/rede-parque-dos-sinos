"use client";

// Navegação por pílulas (abas) reutilizável. Linha rolável na horizontal;
// a pílula ativa fica destacada em vermelho. Usada como shell de módulos no
// /painel e no /admin — novos módulos entram como mais uma pílula.
//   secoes:   [{ id, label }]
//   ativo:    id da seção ativa
//   onChange: (id) => void
export default function Pilulas({ secoes, ativo, onChange, className = "" }) {
  return (
    <div className={`flex gap-1.5 overflow-x-auto -mx-1 px-1 ${className}`}>
      {secoes.map((sec) => (
        <button
          key={sec.id}
          type="button"
          onClick={() => onChange(sec.id)}
          aria-pressed={ativo === sec.id}
          className={`px-3 py-[6px] rounded-full text-[12px] font-bold whitespace-nowrap ${
            ativo === sec.id
              ? "bg-brand-red text-white"
              : "bg-brand-surface text-brand-grey border border-brand-border"
          }`}
        >
          {sec.label}
        </button>
      ))}
    </div>
  );
}
