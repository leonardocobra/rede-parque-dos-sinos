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
      tipo, mensagem: mensagem.trim(), pagina: pathname,
    });
    if (error) { setStatus("error"); setSubmitting(false); return; }
    setStatus("success");
    setTimeout(() => { setOpen(false); setStatus(null); setTipo(""); setMensagem(""); }, 2000);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Reportar feedback" style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 90,
        width: 48, height: 48, borderRadius: "50%",
        background: "var(--black)", color: "#fff", border: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        cursor: "pointer", transition: "transform 0.15s",
      }}>💬</button>

      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 20px",
            maxWidth: 440, width: "100%", maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 22, margin: 0 }}>Feedback</h3>
              <button onClick={() => setOpen(false)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, width: 30, height: 30, fontSize: 16, color: "var(--grey)", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {status === "success" ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <p style={{ fontFamily: "var(--display)", fontSize: 18 }}>Obrigado pelo feedback!</p>
                <p style={{ fontSize: 13, color: "var(--grey)", marginTop: 6 }}>Sua mensagem foi registrada.</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 10 }}>O que você quer reportar?</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                  {tipos.map((t) => (
                    <button key={t.value} onClick={() => setTipo(t.value)} style={{
                      background: tipo === t.value ? "var(--red-light)" : "#fff",
                      border: "1.5px solid " + (tipo === t.value ? "var(--red)" : "var(--border)"),
                      borderRadius: 10, padding: "14px 8px", textAlign: "center",
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: tipo === t.value ? "var(--red)" : "var(--black)" }}>{t.label}</div>
                      <div style={{ fontSize: 10, color: "var(--grey-light)", marginTop: 2 }}>{t.desc}</div>
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, display: "block" }}>Descreva</label>
                  <textarea placeholder="O que aconteceu? O que poderia melhorar?" value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4} style={{
                    width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid var(--border)",
                    fontSize: 14, background: "#fff", outline: "none", resize: "vertical",
                    boxSizing: "border-box",
                  }} />
                  <div style={{ fontSize: 10, color: "var(--grey-light)", marginTop: 4, textAlign: "right" }}>
                    {mensagem.trim().length < 5 ? "Mínimo 5 caracteres" : "✓"}
                  </div>
                </div>

                {status === "error" && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>Erro ao enviar. Tente novamente.</p>}

                <button onClick={submit} disabled={!valid || submitting} style={{
                  width: "100%", background: valid ? "var(--black)" : "var(--border)", color: "#fff",
                  border: "none", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 700,
                  opacity: submitting ? 0.6 : 1,
                }}>{submitting ? "Enviando..." : "Enviar Feedback"}</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
