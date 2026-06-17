"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { getBrowserSupabase } from "../../lib/supabase/client";

const inputClass =
  "w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-brand-card outline-none text-brand-text";

export default function Entrar() {
  return (
    <>
      <Nav />
      <Suspense>
        <EntrarForm />
      </Suspense>
      <Footer />
    </>
  );
}

function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkErro = searchParams.get("erro") === "link";

  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  // etapa: email (pede e-mail) | codigo (pede o código de 6 dígitos)
  const [etapa, setEtapa] = useState("email");
  const [status, setStatus] = useState("idle"); // idle | enviando | verificando | erro
  const emailValido = /\S+@\S+\.\S+/.test(email);
  const codigoValido = /^\d{6}$/.test(codigo.trim());

  async function enviar() {
    if (!emailValido || status === "enviando") return;
    setStatus("enviando");
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await getBrowserSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setStatus("erro");
      return;
    }
    setStatus("idle");
    setEtapa("codigo");
  }

  async function verificar() {
    if (!codigoValido || status === "verificando") return;
    setStatus("verificando");
    const { error } = await getBrowserSupabase().auth.verifyOtp({
      email: email.trim(),
      token: codigo.trim(),
      type: "email",
    });
    if (error) {
      setStatus("erro");
      return;
    }
    // Sessão criada: vai para o painel e atualiza os Server Components.
    router.push("/painel");
    router.refresh();
  }

  return (
    <div className="px-5 py-6 max-w-[440px] mx-auto">
      <h2 className="font-display text-[26px] mb-1">Entrar</h2>
      <p className="text-[13px] text-brand-grey-light mb-6">
        Para gerenciar seu cadastro. Enviamos um código de acesso ao seu e-mail.
      </p>

      {etapa === "codigo" ? (
        <div>
          <p className="text-[13px] text-brand-grey mb-4">
            Enviamos um código de 6 dígitos (e um link) para <strong>{email}</strong>. Digite o
            código abaixo ou clique no link do e-mail.
          </p>
          <label className="block text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-[5px]">
            Código de acesso
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && verificar()}
            className={`${inputClass} tracking-[6px] text-center font-mono text-lg`}
          />

          {status === "erro" && (
            <p className="text-brand-red text-[13px] mt-3">
              Código inválido ou expirado. Tente novamente.
            </p>
          )}

          <button
            onClick={verificar}
            disabled={!codigoValido || status === "verificando"}
            className={`w-full ${
              codigoValido ? "bg-brand-red" : "bg-brand-border"
            } text-white border-none rounded-lg py-3.5 text-[15px] font-bold mt-4 ${
              status === "verificando" ? "opacity-60" : ""
            }`}
          >
            {status === "verificando" ? "Verificando..." : "Entrar"}
          </button>

          <button
            onClick={() => {
              setEtapa("email");
              setCodigo("");
              setStatus("idle");
            }}
            className="w-full text-[12px] text-brand-grey-light font-bold mt-3"
          >
            ← Usar outro e-mail
          </button>
        </div>
      ) : (
        <div>
          {linkErro && (
            <p className="text-brand-red text-[13px] mb-3">
              O link expirou ou já foi usado. Peça um novo abaixo.
            </p>
          )}
          <label className="block text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-[5px]">
            E-mail
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
            className={inputClass}
          />

          {status === "erro" && (
            <p className="text-brand-red text-[13px] mt-3">
              Não foi possível enviar o código. Tente novamente.
            </p>
          )}

          <button
            onClick={enviar}
            disabled={!emailValido || status === "enviando"}
            className={`w-full ${
              emailValido ? "bg-brand-red" : "bg-brand-border"
            } text-white border-none rounded-lg py-3.5 text-[15px] font-bold mt-4 ${
              status === "enviando" ? "opacity-60" : ""
            }`}
          >
            {status === "enviando" ? "Enviando..." : "Enviar código de acesso"}
          </button>
        </div>
      )}
    </div>
  );
}
