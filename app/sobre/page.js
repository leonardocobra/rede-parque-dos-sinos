import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { REGRAS } from "../config";

function Section({ title, children }) {
  return (
    <div className="bg-brand-card rounded-[10px] p-5 border border-brand-border mb-3.5">
      <div className="text-[10px] font-extrabold tracking-[2px] uppercase text-brand-red mb-3.5">
        {title}
      </div>
      {children}
    </div>
  );
}

export default function Sobre() {
  return (
    <>
      <Nav />
      <div className="px-5 py-6 max-w-[560px] mx-auto">
        <h2 className="font-display text-[26px] mb-5">Sobre a Rede</h2>

        <Section title="Regras Básicas">
          {REGRAS.map((r, i) => (
            <div
              key={i}
              className="flex gap-3 items-start mb-2.5 text-[13px] text-brand-grey leading-[1.5]"
            >
              <span className="bg-brand-black text-white rounded-[4px] min-w-[22px] h-[22px] flex items-center justify-center text-[11px] font-extrabold shrink-0">
                {i + 1}
              </span>
              <span>{r}</span>
            </div>
          ))}
        </Section>

        <Section title="Quem Pode Participar">
          <p className="text-[13px] text-brand-grey leading-relaxed mb-3">
            Qualquer morador do Parque dos Sinos que preste serviços pode se cadastrar
            gratuitamente:
          </p>
          <div className="flex flex-wrap gap-[5px]">
            {[
              "Pedreiro",
              "Eletricista",
              "Encanador",
              "Pintor",
              "Jardineiro",
              "Diarista",
              "Cuidador de Idosos",
              "Professor Particular",
              "Técnico de Informática",
              "Mecânico",
              "Costureira",
              "Designer",
              "Social Media",
              "Fotógrafo",
            ].map((s) => (
              <span
                key={s}
                className="bg-brand-surface px-2.5 py-1 rounded-[4px] text-[11px] text-brand-grey font-medium border border-brand-border"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Sistema de Avaliação">
          <p className="text-[13px] text-brand-grey leading-relaxed mb-3">
            Após cada serviço, os moradores respondem três perguntas:
          </p>
          {["Contrataria novamente?", "Foi pontual?", "Serviço entregue conforme combinado?"].map(
            (q, i) => (
              <div
                key={i}
                className="bg-brand-surface rounded-[6px] px-3.5 py-2.5 mb-1.5 text-[13px] text-brand-grey border border-brand-border"
              >
                {q}
              </div>
            )
          )}
          <p className="text-xs text-brand-grey-light mt-3 leading-[1.5]">
            Profissionais com 80%+ de respostas positivas e no mínimo 3 avaliações recebem o selo de
            Recomendado.
          </p>
        </Section>

        <Section title="Potenciais Canais de Comunicação">
          {[
            [
              "Grupo no WhatsApp",
              "Canal principal para troca rápida entre moradores e profissionais",
            ],
            [
              "Perfil no Instagram",
              "Vitrine visual com Profissional da Semana e oportunidades locais",
            ],
            ["Murais Comunitários", "Cartazes em supermercados, padarias, igrejas e escolas"],
            ["Grupo no Facebook", "Alcance complementar para moradores que usam a plataforma"],
            ["Lista de Transmissão", "Envio semanal com novos profissionais e destaques"],
          ].map((c, i) => (
            <div key={i} className={`${i < 4 ? "mb-3" : ""} text-[13px] text-brand-grey`}>
              <div className="font-extrabold text-brand-text mb-0.5">{c[0]}</div>
              <div className="leading-[1.5]">{c[1]}</div>
            </div>
          ))}
        </Section>

        <div className="text-center my-5">
          <Link
            href="/cadastro"
            className="bg-brand-red text-white rounded-lg py-3 px-7 text-sm font-bold inline-block"
          >
            Cadastrar Meu Serviço
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
