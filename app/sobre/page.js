import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

function Section({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid var(--border)", marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "var(--red)", marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

export default function Sobre() {
  return (
    <>
      <Nav />
      <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 26, marginBottom: 20 }}>Sobre a Rede</h2>

        <Section title="Regras Básicas">
          {["Divulgação gratuita.", "Respeito entre todos os participantes.", "Não são permitidos conteúdos ilegais.", "A contratação é de responsabilidade das partes.", "O grupo apenas facilita o contato.", "Avaliações devem ser respeitosas e baseadas em experiências reais."].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10, fontSize: 13, color: "var(--grey)", lineHeight: 1.5 }}>
              <span style={{ background: "var(--black)", color: "#fff", borderRadius: 4, minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              <span>{r}</span>
            </div>
          ))}
        </Section>

        <Section title="Quem Pode Participar">
          <p style={{ fontSize: 13, color: "var(--grey)", lineHeight: 1.6, marginBottom: 12 }}>Qualquer morador do Parque dos Sinos que preste serviços pode se cadastrar gratuitamente:</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {["Pedreiro","Eletricista","Encanador","Pintor","Jardineiro","Diarista","Cuidador de Idosos","Professor Particular","Técnico de Informática","Mecânico","Costureira","Designer","Social Media","Fotógrafo"].map((s) => (
              <span key={s} style={{ background: "var(--bg)", padding: "4px 10px", borderRadius: 4, fontSize: 11, color: "var(--grey)", fontWeight: 500, border: "1px solid var(--border)" }}>{s}</span>
            ))}
          </div>
        </Section>

        <Section title="Sistema de Avaliação">
          <p style={{ fontSize: 13, color: "var(--grey)", lineHeight: 1.6, marginBottom: 12 }}>Após cada serviço, os moradores respondem três perguntas:</p>
          {["Contrataria novamente?", "Foi pontual?", "Serviço entregue conforme combinado?"].map((q, i) => (
            <div key={i} style={{ background: "var(--bg)", borderRadius: 6, padding: "10px 14px", marginBottom: 6, fontSize: 13, color: "var(--grey)", border: "1px solid var(--border)" }}>{q}</div>
          ))}
          <p style={{ fontSize: 12, color: "var(--grey-light)", marginTop: 12, lineHeight: 1.5 }}>Profissionais com 80%+ de respostas positivas e no mínimo 3 avaliações recebem o selo de Recomendado.</p>
        </Section>

        <Section title="Potenciais Canais de Comunicação">
          {[
            ["Grupo no WhatsApp", "Canal principal para troca rápida entre moradores e profissionais"],
            ["Perfil no Instagram", "Vitrine visual com Profissional da Semana e oportunidades locais"],
            ["Murais Comunitários", "Cartazes em supermercados, padarias, igrejas e escolas"],
            ["Grupo no Facebook", "Alcance complementar para moradores que usam a plataforma"],
            ["Lista de Transmissão", "Envio semanal com novos profissionais e destaques"],
          ].map((c, i) => (
            <div key={i} style={{ marginBottom: i < 4 ? 12 : 0, fontSize: 13, color: "var(--grey)" }}>
              <div style={{ fontWeight: 800, color: "var(--black)", marginBottom: 2 }}>{c[0]}</div>
              <div style={{ lineHeight: 1.5 }}>{c[1]}</div>
            </div>
          ))}
        </Section>

        <div style={{ textAlign: "center", marginTop: 20, marginBottom: 20 }}>
          <Link href="/cadastro" style={{ background: "var(--red)", color: "#fff", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, display: "inline-block" }}>Cadastrar Meu Serviço</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
