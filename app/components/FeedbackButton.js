"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../../lib/supabase";

const tipos = [
  { value: "bug", label: "Bug", icon: "🐛", desc: "Algo não funciona" },
  { value: "melhoria", label: "Melhoria", icon: "💡", desc: "Sugestão de melhoria" },
  { value: "outro", label: "Outro", icon: "💬", desc: "Comentário geral" },
];

export default function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const valid = tipo && mensagem.trim().length >= 5;

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      tipo,
      mensagem: mensagem.trim(),
      pagina: pathname,
    });
    if (error) {
      setStatus("error");
      setSubmitting(false);
      return;
    }
    setStatus("success");
    setTimeout(() => {
      setOpen(false);
      setStatus(null);
      setTipo("");
      setMensagem("");
    }, 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Reportar feedback"
        className="fixed bottom-5 right-5 z-[90] w-12 h-12 rounded-full bg-brand-black text-white border-none flex items-center justify-center text-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.2)] cursor-pointer transition-transform duration-150"
      >
        💬
      </button>

      {open && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          className="fixed inset-0 bg-black/40 z-[200] flex items-end justify-center backdrop-blur-sm"
        >
          <div className="bg-white rounded-t-[20px] px-5 py-6 max-w-[440px] w-full max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display text-[22px] m-0">Feedback</h3>
              <button
                onClick={() => setOpen(false)}
                className="bg-brand-surface border border-brand-border rounded-[6px] w-[30px] h-[30px] text-base text-brand-grey flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {status === "success" ? (
              <div className="text-center py-8">
                <div className="text-[36px] mb-3">✅</div>
                <p className="font-display text-lg">Obrigado pelo feedback!</p>
                <p className="text-[13px] text-brand-grey mt-1.5">Sua mensagem foi registrada.</p>
              </div>
            ) : (
              <>
                <div className="text-[13px] text-brand-grey mb-2.5">O que você quer reportar?</div>
                <div className="grid grid-cols-3 gap-2 mb-[18px]">
                  {tipos.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTipo(t.value)}
                      className={`border-[1.5px] rounded-[10px] py-3.5 px-2 text-center cursor-pointer transition-all duration-150 ${
                        tipo === t.value
                          ? "bg-brand-red-light border-brand-red"
                          : "bg-white border-brand-border"
                      }`}
                    >
                      <div className="text-[22px] mb-1">{t.icon}</div>
                      <div
                        className={`text-xs font-bold ${
                          tipo === t.value ? "text-brand-red" : "text-brand-black"
                        }`}
                      >
                        {t.label}
                      </div>
                      <div className="text-[10px] text-brand-grey-light mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="mb-4">
                  <label className="block text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-[5px]">
                    Descreva
                  </label>
                  <textarea
                    placeholder="O que aconteceu? O que poderia melhorar?"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    rows={4}
                    className="w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-white outline-none resize-y box-border"
                  />
                  <div className="text-[10px] text-brand-grey-light mt-1 text-right">
                    {mensagem.trim().length < 5 ? "Mínimo 5 caracteres" : "✓"}
                  </div>
                </div>

                {status === "error" && (
                  <p className="text-brand-red text-[13px] mb-3">
                    Erro ao enviar. Tente novamente.
                  </p>
                )}

                <button
                  onClick={submit}
                  disabled={!valid || submitting}
                  className={`w-full ${
                    valid ? "bg-brand-black" : "bg-brand-border"
                  } text-white border-none rounded-lg py-3.5 text-[15px] font-bold ${
                    submitting ? "opacity-60" : ""
                  }`}
                >
                  {submitting ? "Enviando..." : "Enviar Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
