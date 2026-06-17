import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { CATS, REGRAS } from "./config";

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

      {/* Ação rápida — Avaliar (ausente no Hero) */}
      <div className="px-5 pt-8 pb-2 max-w-[560px] mx-auto">
        <Link
          href="/avaliar"
          className="bg-[#333] rounded-xl py-4 px-5 flex items-center gap-4 block"
        >
          <div className="text-[28px]">⭐</div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Avaliar Profissional</div>
            <div className="text-xs text-[#aaa] leading-snug mt-0.5">
              Já contratou alguém pela rede? Deixe sua avaliação.
            </div>
          </div>
        </Link>
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
              href: "/cadastro",
              cta: "Cadastrar serviço",
            },
            {
              n: "2",
              t: "Vizinhos encontram você",
              d: "Moradores consultam o catálogo e entram em contato direto pelo WhatsApp.",
              icon: "🤝",
              href: "/catalogo",
              cta: "Ver catálogo",
            },
            {
              n: "3",
              t: "Comunidade avalia",
              d: "Após o serviço, 3 perguntas rápidas. Boas avaliações geram mais indicações.",
              icon: "⭐",
              href: "/avaliar",
              cta: "Avaliar profissional",
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
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1 mt-2.5 text-[13px] font-bold text-brand-red"
                >
                  {s.cta} →
                </Link>
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

      {/* Regras Básicas */}
      <div className="px-5 pt-9 pb-2 max-w-[560px] mx-auto">
        <h2 className="font-display text-[26px] mb-1.5 text-center">Regras Básicas</h2>
        <p className="text-[13px] text-brand-grey-light text-center mb-5">
          Como a rede funciona para todos
        </p>
        <div className="bg-white border border-brand-border rounded-xl p-5">
          {REGRAS.map((r, i) => (
            <div
              key={i}
              className={`flex gap-3 items-start text-[13px] text-brand-grey leading-[1.5] ${
                i < REGRAS.length - 1 ? "mb-2.5" : ""
              }`}
            >
              <span className="bg-brand-black text-white rounded-[4px] min-w-[22px] h-[22px] flex items-center justify-center text-[11px] font-extrabold shrink-0">
                {i + 1}
              </span>
              <span>{r}</span>
            </div>
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
