"use client";
import { formatarPreco } from "../../../lib/itens";

// Render dos itens/subserviços no perfil público (Frente 1a).
// Híbrido: se ao menos um item tem foto, vira um carrossel horizontal de cards
// com foto (2 visíveis por vez, rola para o lado). Sem nenhuma foto, vira uma
// lista de texto enxuta (título + preço). Sem itens, não renderiza nada — o
// perfil fica idêntico ao de antes.
export default function ItensDoServico({ itens }) {
  const lista = itens || [];
  if (lista.length === 0) return null;

  const temFoto = lista.some((i) => i.foto_url);

  if (!temFoto) {
    return (
      <ul className="mt-2 space-y-1.5">
        {lista.map((item) => {
          const preco = formatarPreco(item.preco, item.preco_tipo);
          return (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 text-[13px] border-b border-brand-border pb-1.5 last:border-0"
            >
              <span className="text-brand-text">{item.titulo}</span>
              {(preco || item.disponibilidade) && (
                <span className="text-brand-grey-light font-bold whitespace-nowrap shrink-0">
                  {preco || item.disponibilidade}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="mt-2 flex gap-2.5 overflow-x-auto snap-x snap-mandatory -mx-1 px-1 pb-2">
      {lista.map((item) => {
        const preco = formatarPreco(item.preco, item.preco_tipo);
        return (
          <div
            key={item.id}
            className="snap-start shrink-0 w-[128px] border border-brand-border rounded-lg overflow-hidden"
          >
            {item.foto_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.foto_url}
                alt={item.titulo}
                loading="lazy"
                className="w-full h-[88px] object-cover"
              />
            ) : (
              <div className="w-full h-[88px] bg-brand-surface" />
            )}
            <div className="p-2">
              <div className="text-[12px] font-bold leading-tight">{item.titulo}</div>
              {preco && <div className="text-[11px] text-brand-grey mt-0.5">{preco}</div>}
              {item.disponibilidade && (
                <div className="text-[11px] text-brand-grey-light">{item.disponibilidade}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
