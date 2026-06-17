import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import TypedBrand from "./components/TypedBrand";
import { CATS, REGRAS } from "./config";

export default function Home() {
  return (
    <>
      <Nav />

      {/* Hero — ocupa a primeira tela inteira (Como Funciona fica abaixo da dobra) */}
      <div className="px-6 py-12 text-center relative border-b border-brand-border flex flex-col justify-center min-h-[calc(100dvh-52px)]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-brand-red-light blur-[60px] opacity-60 pointer-events-none" />
        <div className="relative z-[2] max-w-[560px] mx-auto w-full">
          <div className="text-[11px] font-extrabold tracking-[3px] uppercase text-brand-red mb-4 text-left">
            Parque dos Sinos · Jacareí
          </div>
          <h1 className="font-mono font-extrabold text-[clamp(48px,16vw,72px)] leading-[1.05] mb-4 flex justify-start text-brand-text">
            <TypedBrand />
          </h1>
          <p className="text-[15px] text-brand-grey leading-relaxed max-w-[420px] mb-10 text-left">
            A rede de profissionais de confiança da sua região. Gratuita, organizada e feita pela
            comunidade.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/catalogo"
              className="bg-brand-black text-white rounded-xl py-4 px-5 block text-right"
            >
              <div className="text-[17px] font-bold leading-tight">Ver Catálogo →</div>
              <div className="text-xs text-brand-onink-muted mt-0.5">
                Encontre profissionais perto de você
              </div>
            </Link>
            <Link
              href="/cadastro"
              className="bg-brand-red text-white rounded-xl py-4 px-5 block text-right"
            >
              <div className="text-[17px] font-bold leading-tight">Cadastrar Serviço →</div>
              <div className="text-xs text-white/75 mt-0.5">
                Divulgue seu trabalho gratuitamente
              </div>
            </Link>
            <Link
              href="/avaliar"
              className="bg-brand-black rounded-xl py-4 px-5 block text-left mt-2"
            >
              <div className="text-sm font-bold text-white leading-tight">Avaliar Profissional</div>
              <div className="text-xs text-brand-onink-muted leading-snug mt-0.5">
                Já contratou alguém pela rede?
                <br />
                Deixe sua avaliação.
              </div>
            </Link>
          </div>
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
              className="bg-brand-card rounded-xl p-5 flex gap-4 border border-brand-border items-start"
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
              className="bg-brand-card border border-brand-border rounded-[10px] p-3.5 block"
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
        <div className="bg-brand-card border border-brand-border rounded-xl p-5">
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

      {/* CTA */}
      <div className="px-5 pt-9 pb-10 max-w-[560px] mx-auto">
        <div className="bg-brand-black rounded-2xl py-8 px-6 text-right">
          <h3 className="font-display text-[22px] text-white mb-2">Faça parte da rede</h3>
          <p className="text-[13px] text-brand-onink-muted leading-[1.5] max-w-[340px] ml-auto mb-5">
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
