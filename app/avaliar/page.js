"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 8 }}>
        {[true, false].map((v) => (
          <button key={String(v)} onClick={() => onChange(v)} style={{
            flex: 1, padding: "10px", borderRadius: 6, fontSize: 13, fontWeight: 700, transition: "all .15s",
            background: value === v ? (v ? "#E8F5E9" : "#FFEBEE") : "#fff",
            color: value === v ? (v ? "#2E7D32" : "var(--red)") : "var(--grey)",
            border: "1.5px solid " + (value === v ? (v ? "#A5D6A7" : "#EF9A9A") : "var(--border)"),
          }}>{v ? "Sim" : "Não"}</button>
        ))}
      </div>
    </div>
  );
}

export default function Avaliar() {
  return <Suspense><AvaliarContent /></Suspense>;
}

function AvaliarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preId = searchParams.get("id");
  const preNome = searchParams.get("nome");

  const [profs, setProfs] = useState([]);
  const [profId, setProfId] = useState(preId || "");
  const [pontual, setPontual] = useState(null);
  const [novamente, setNovamente] = useState(null);
  const [conforme, setConforme] = useState(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("profissionais").select("id, nome, servico").order("nome").then(({ data }) => setProfs(data || []));
  }, []);

  const valid = profId && pontual !== null && novamente !== null && conforme !== null;

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("avaliacoes").insert({
      profissional_id: profId,
      pontual, novamente, conforme, nota,
      comentario: comentario.trim(),
    });
    if (error) { setStatus("error"); setSubmitting(false); return; }
    setStatus("success");
    setTimeout(() => router.push("/catalogo"), 2000);
  }

  return (
    <>
      <Nav />
      <div style={{ padding: "24px 20px", maxWidth: 500, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 26, marginBottom: 4 }}>Avaliar Profissional</h2>
        <p style={{ fontSize: 13, color: "var(--grey-light)", marginBottom: 24 }}>Sua avaliação ajuda outros moradores</p>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--red-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 22 }}>Avaliação Enviada!</h3>
            <p style={{ fontSize: 13, color: "var(--grey)", marginTop: 8 }}>Obrigado por contribuir com a comunidade.</p>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, display: "block" }}>Profissional *</label>
              <select value={profId} onChange={(e) => setProfId(e.target.value)} style={{
                width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid var(--border)",
                fontSize: 14, background: "#fff", outline: "none",
                color: profId ? "var(--black)" : "var(--grey-light)",
              }}>
                <option value="">Selecione o profissional...</option>
                {profs.map((p) => <option key={p.id} value={p.id}>{p.nome} – {p.servico}</option>)}
              </select>
              {preNome && <div style={{ fontSize: 12, color: "var(--grey-light)", marginTop: 4 }}>Pré-selecionado: {preNome}</div>}
            </div>

            <Toggle label="Foi pontual?" value={pontual} onChange={setPontual} />
            <Toggle label="Contrataria novamente?" value={novamente} onChange={setNovamente} />
            <Toggle label="Serviço conforme combinado?" value={conforme} onChange={setConforme} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 8 }}>Nota geral *</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setNota(n)} style={{
                    flex: 1, padding: "12px", borderRadius: 6, fontSize: 20, transition: "all .15s",
                    background: nota >= n ? "#FFF8E1" : "#fff",
                    border: "1.5px solid " + (nota >= n ? "#FFD54F" : "var(--border)"),
                  }}>★</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, display: "block" }}>Comentário (opcional)</label>
              <textarea placeholder="Conte como foi a experiência..." value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} style={{
                width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid var(--border)",
                fontSize: 14, background: "#fff", outline: "none", resize: "vertical",
              }} />
            </div>

            {status === "error" && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>Erro ao enviar. Tente novamente.</p>}

            <button onClick={submit} disabled={!valid || submitting} style={{
              width: "100%", background: valid ? "var(--black)" : "var(--border)", color: "#fff",
              border: "none", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 700,
              opacity: submitting ? 0.6 : 1,
            }}>{submitting ? "Enviando..." : "Enviar Avaliação"}</button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
