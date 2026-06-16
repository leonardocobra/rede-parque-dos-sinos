import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { CATS } from "./config";

export default function Home() {
  return (
    <>
      <Nav />
      <div
        style={{
          padding: "56px 24px 48px",
          textAlign: "center",
          position: "relative",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "var(--red-light)",
            filter: "blur(60px)",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 480, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--red)",
              marginBottom: 16,
            }}
          >
            Parque dos Sinos · Jacareí – SP
          </div>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: 38,
              fontWeight: 400,
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Rede de Profissionais
            <br />
            do Parque dos Sinos
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--grey)",
              lineHeight: 1.6,
              maxWidth: 400,
              margin: "0 auto 32px",
            }}
          >
            Conectando moradores e prestadores de serviço do bairro. Gratuito, organizado e feito
            pela comunidade.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/catalogo"
              style={{
                background: "var(--black)",
                color: "#fff",
                borderRadius: 8,
                padding: "13px 28px",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Ver Catálogo
            </Link>
            <Link
              href="/cadastro"
              style={{
                background: "var(--red)",
                color: "#fff",
                borderRadius: 8,
                padding: "13px 28px",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Cadastrar Serviço
            </Link>
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 20px 8px", maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Cadastrar\nServiço", icon: "📝", href: "/cadastro", bg: "var(--red)" },
            { label: "Ver\nCatálogo", icon: "📋", href: "/catalogo", bg: "var(--black)" },
            { label: "Avaliar\nProfissional", icon: "⭐", href: "/avaliar", bg: "#333" },
          ].map((a, i) => (
            <Link
              key={i}
              href={a.href}
              style={{
                background: a.bg,
                borderRadius: 12,
                padding: "20px 12px",
                textAlign: "center",
                display: "block",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1.4,
                  whiteSpace: "pre-line",
                }}
              >
                {a.label}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ padding: "32px 20px 8px", maxWidth: 560, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--display)",
            fontSize: 26,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Como Funciona
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
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
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "20px",
                display: "flex",
                gap: 16,
                border: "1px solid var(--border)",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      background: "var(--red)",
                      color: "#fff",
                      borderRadius: 4,
                      width: 20,
                      height: 20,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {s.n}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{s.t}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--grey)", lineHeight: 1.55 }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "36px 20px 8px", maxWidth: 560, margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--display)",
            fontSize: 26,
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          Categorias
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--grey-light)",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Tipos de serviço que você pode cadastrar
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {CATS.map((c, i) => (
            <Link
              key={i}
              href={"/catalogo?cat=" + encodeURIComponent(c.value)}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "14px",
                display: "block",
              }}
            >
              <span style={{ fontSize: 22 }}>{c.icon}</span>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6, marginBottom: 3 }}>
                {c.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--grey-light)", lineHeight: 1.4 }}>
                {c.ex}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ padding: "36px 20px 8px", maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "28px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 4,
              height: "100%",
              background: "var(--red)",
            }}
          />
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--red)",
              marginBottom: 12,
            }}
          >
            Manifesto
          </div>
          <p
            style={{
              fontFamily: "var(--display)",
              fontStyle: "italic",
              fontSize: 18,
              lineHeight: 1.55,
            }}
          >
            Acreditamos que o Parque dos Sinos é construído por pessoas que se ajudam. Queremos
            manter nossas ruas organizadas e apoiar trabalhadores honestos.
          </p>
        </div>
      </div>

      <div style={{ padding: "36px 20px 40px", maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            background: "var(--black)",
            borderRadius: 14,
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <h3
            style={{ fontFamily: "var(--display)", fontSize: 22, color: "#fff", marginBottom: 8 }}
          >
            Faça parte da rede
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "#aaa",
              lineHeight: 1.5,
              maxWidth: 340,
              margin: "0 auto 20px",
            }}
          >
            Cadastre seu serviço gratuitamente e seja encontrado pelos vizinhos.
          </p>
          <Link
            href="/cadastro"
            style={{
              background: "var(--red)",
              color: "#fff",
              borderRadius: 8,
              padding: "13px 32px",
              fontSize: 15,
              fontWeight: 700,
              display: "inline-block",
            }}
          >
            Cadastrar Agora
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
