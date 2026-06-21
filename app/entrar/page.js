"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "../components/features/Nav";
import Footer from "../components/features/Footer";
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
  const searchParams = useSearchParams();
  const linkErro = searchParams.get("erro") === "link";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | enviando | enviado | erro | limite
  const valido = /\S+@\S+\.\S+/.test(email);

  async function enviar() {
    if (!valido || status === "enviando") return;
    setStatus("enviando");
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await getBrowserSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (!error) {
      setStatus("enviado");
    } else if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      setStatus("limite");
    } else {
      setStatus("erro");
    }
  }

  return (
    <div className="px-5 py-6 max-w-[440px] mx-auto">
      <h2 className="font-display text-[26px] mb-1">Entrar</h2>
      <p className="text-[13px] text-brand-grey-light mb-6">
        Para gerenciar seu cadastro. Enviamos um link de acesso ao seu e-mail.
      </p>

      {status === "enviado" ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-full bg-brand-red-light flex items-center justify-center mx-auto mb-4 text-[28px]">
            ✉️
          </div>
          <h3 className="font-display text-[22px]">Verifique seu e-mail</h3>
          <p className="text-[13px] text-brand-grey mt-2">
            Enviamos um link de acesso para <strong>{email}</strong>. Abra no mesmo dispositivo.
          </p>
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
              Não foi possível enviar o link. Tente novamente.
            </p>
          )}

          {status === "limite" && (
            <p className="text-brand-red text-[13px] mt-3">
              Você pediu muitos links em pouco tempo. Aguarde alguns minutos e tente novamente —
              verifique também sua caixa de spam.
            </p>
          )}

          <button
            onClick={enviar}
            disabled={!valido || status === "enviando"}
            className={`w-full ${
              valido ? "bg-brand-red" : "bg-brand-border"
            } text-white border-none rounded-lg py-3.5 text-[15px] font-bold mt-4 ${
              status === "enviando" ? "opacity-60" : ""
            }`}
          >
            {status === "enviando" ? "Enviando..." : "Enviar link de acesso"}
          </button>
        </div>
      )}
    </div>
  );
}
