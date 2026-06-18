"use client";
import { useState } from "react";
import Link from "next/link";
import { iniciais } from "../../../lib/avatar";
import ServicosInterativos from "./ServicosInterativos";

// Reúne, sob um único estado client-side, o bloco "Serviços" (chips) e a seção
// "Outros de {categoria}". Ao trocar o serviço ativo nos chips, a seção "Outros"
// passa a refletir a categoria daquele serviço.
//
// `outrosPorCategoria` é um map { categoria -> lista } pré-buscado no servidor
// (ver getOutrosPorCategoria), então não há fetch no cliente e o HTML inicial já
// traz os "outros" da categoria primária — a página segue indexável.
//
// O miolo entre as duas seções (bio, CTAs, comentários) chega como `children`
// server-rendered e é apenas repassado, sem hidratar.
export default function PerfilInterativo({ servicos, outrosPorCategoria, cidade, children }) {
  const [ativoId, setAtivoId] = useState(servicos[0]?.id || null);

  const ativo = servicos.find((s) => s.id === ativoId) || servicos[0];
  const categoriaAtiva = ativo?.categoria || "";
  const outros = outrosPorCategoria?.[categoriaAtiva] || [];

  return (
    <>
      {servicos.length > 0 && (
        <section className="bg-brand-card rounded-[10px] border border-brand-border p-4 mt-3">
          <h2 className="font-display text-[16px] mb-2">Serviços</h2>
          <ServicosInterativos servicos={servicos} ativoId={ativoId} onAtivoChange={setAtivoId} />
        </section>
      )}

      {children}

      {outros.length > 0 && (
        <section className="mt-7">
          <h2 className="font-display text-[18px] mb-2">Outros de {categoriaAtiva}</h2>
          <div className="space-y-2">
            {outros.map((o) => {
              const oServicos = o.profissional_servicos || [];
              return (
                <Link
                  key={o.id}
                  href={"/profissional/" + o.id}
                  className="bg-brand-card rounded-[10px] border border-brand-border p-3 flex gap-3 items-center"
                >
                  {o.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.foto_url}
                      alt={"Foto de " + o.nome}
                      className="w-[40px] h-[40px] rounded-lg object-cover shrink-0 border border-brand-border"
                    />
                  ) : (
                    <div className="w-[40px] h-[40px] rounded-lg bg-brand-surface flex items-center justify-center text-[12px] font-extrabold text-brand-red shrink-0 border border-brand-border">
                      {iniciais(o.nome)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] truncate">{o.nome}</div>
                    <div className="text-[12px] text-brand-red font-bold truncate">
                      {oServicos[0]?.servico || ""}
                    </div>
                  </div>
                  <span className="text-brand-grey-light text-[13px]">→</span>
                </Link>
              );
            })}
          </div>
          <div className="text-right mt-4">
            <Link
              href={"/catalogo?cat=" + encodeURIComponent(categoriaAtiva)}
              className="text-[12px] font-bold text-brand-grey"
            >
              Ver todos em {cidade} →
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
