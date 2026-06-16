import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { CATS } from "./config";

export default function Home() {
  return (
    <>
      <Nav />

      {/* Hero */}
      <div className="px-6 pt-14 pb-12 text-center relative border-b border-brand-border">
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-brand-red-light blur-[60px] opacity-60 pointer-events-none" />
        <div className="relative z-[2] max-w-[480px] mx-auto">
          <div className="text-[11px] font-extrabold tracking-[3px] uppercase text-brand-red mb-4">
            Parque dos Sinos · Jacareí – SP
          </div>
          <h1 className="font-display text-[38px] font-normal leading-[1.15] mb-4">
            Rede de Profissionais
            <br />
            do Parque dos Sinos
          </h1>
          <p className="text-[15px] text-brand-grey leading-relaxed max-w-[400px] mx-auto mb-8">
            Conectando moradores e prestadores de serviço do bairro. Gratuito, organizado e feito
            pela comunidade.
          </p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            <Link
              href="/catalogo"
              className="bg-brand-black text-white rounded-lg px-7 py-[13px] text-[15px] font-bold"
            >
              Ver Catálogo
            </Link>
            <Link
              href="/cadastro"
              className="bg-brand-red text-white rounded-lg px-7 py-[13px] text-[15px] font-bold"
            >
              Cadastrar Serviço
            </Link>
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="px-5 pt-8 pb-2 max-w-[560px] mx-auto">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Cadastrar\nServiço", icon: "📝", href: "/cadastro", bg: "bg-brand-red" },
            { label: "Ver\nCatálogo", icon: "📋", href: "/catalogo", bg: "bg-brand-black" },
            { label: "Avaliar\nProfissional", icon: "⭐", href: "/avaliar", bg: "bg-[#333]" },
          ].map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className={`${a.bg} rounded-xl py-5 px-3 text-center block`}
            >
              <div className="text-[28px] mb-2">{a.icon}</div>
              <div className="text-xs font-bold text-white leading-[1.4] whitespace-pre-line">
                {a.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Como Funciona */}
      <div className="px-5 pt-8 pb-2 max-w-[560px] mx-auto">
        <h2 className="font-display text-[26px] mb-6 text-center">Como Funciona</h2>
        <div className="grid gap-3">
          {[
            {
              n: "1",
              t: "Cadastre seu serviço",
              d: "Preencha o formulário com seu nome, serviço, contato e região. Gratuito, menos de 2 minutos.",
              icon: "📝",
            },
            {
              n: "2",
              t: "Vizinhos encontram você",
              d: "Moradores consultam o catálogo e entram em contato direto pelo WhatsApp.",
              icon: "🤝",
            },
            {
              n: "3",
              t: "Comunidade avalia",
              d: "Após o serviço, 3 perguntas rápidas. Boas avaliações geram mais indicações.",
              icon: "⭐",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-5 flex gap-4 border border-brand-border items-start"
            >
              <div className="w-11 h-11 rounded-[10px] bg-brand-surface border border-brand-border flex items-center justify-center text-[22px] shrink-0">
                {s.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-brand-red text-white rounded-[4px] w-5 h-5 inline-flex items-center justify-center text-[11px] font-extrabold">
                    {s.n}
                  </span>
                  <span className="font-bold text-[15px]">{s.t}</span>
                </div>
                <p className="text-[13px] text-brand-grey leading-[1.55]">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categorias */}
      <div className="px-5 pt-9 pb-2 max-w-[560px] mx-auto">
        <h2 className="font-display text-[26px] mb-1.5 text-center">Categorias</h2>
        <p className="text-[13px] text-brand-grey-light text-center mb-5">
          Tipos de serviço que você pode cadastrar
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CATS.map((c, i) => (
            <Link
              key={i}
              href={"/catalogo?cat=" + encodeURIComponent(c.value)}
              className="bg-white border border-brand-border rounded-[10px] p-3.5 block"
            >
              <span className="text-[22px]">{c.icon}</span>
              <div className="text-[13px] font-bold mt-1.5 mb-[3px]">{c.value}</div>
              <div className="text-[11px] text-brand-grey-light leading-[1.4]">{c.ex}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Manifesto */}
      <div className="px-5 pt-9 pb-2 max-w-[560px] mx-auto">
        <div className="bg-brand-surface border border-brand-border rounded-xl py-7 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-red" />
          <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-brand-red mb-3">
            Manifesto
          </div>
          <p className="font-display italic text-lg leading-[1.55]">
            Acreditamos que o Parque dos Sinos é construído por pessoas que se ajudam. Queremos
            manter nossas ruas organizadas e apoiar trabalhadores honestos.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pt-9 pb-10 max-w-[560px] mx-auto">
        <div className="bg-brand-black rounded-2xl py-8 px-6 text-center">
          <h3 className="font-display text-[22px] text-white mb-2">Faça parte da rede</h3>
          <p className="text-[13px] text-[#aaa] leading-[1.5] max-w-[340px] mx-auto mb-5">
            Cadastre seu serviço gratuitamente e seja encontrado pelos vizinhos.
          </p>
          <Link
            href="/cadastro"
            className="bg-brand-red text-white rounded-lg py-[13px] px-8 text-[15px] font-bold inline-block"
          >
            Cadastrar Agora
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}
