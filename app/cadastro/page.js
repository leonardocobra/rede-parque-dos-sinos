"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import { CATS } from "../config";

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--grey)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, display: "block" }}>{label}{required && " *"}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid var(--border)", fontSize: 14, background: "#fff", outline: "none", color: "var(--black)" };

export default function Cadastro() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", telefone: "", servico: "", categoria: "", bairro: "", regioes: "", instagram: "", experiencia: "", descricao: "" });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.nome && form.telefone && form.servico && form.categoria;

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("profissionais").insert({
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      servico: form.servico.trim(),
      categoria: form.categoria,
      bairro: form.bairro.trim(),
      regioes: form.regioes.trim(),
      instagram: form.instagram.trim(),
      experiencia: form.experiencia.trim(),
      descricao: form.descricao.trim(),
    });
    if (error) { setStatus("error"); setSubmitting(false); return; }
    setStatus("success");
    setTimeout(() => router.push("/catalogo"), 2000);
  }

  return (
    <>
      <Nav />
      <div style={{ padding: "24px 20px", maxWidth: 500, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 26, marginBottom: 4 }}>Cadastrar Serviço</h2>
        <p style={{ fontSize: 13, color: "var(--grey-light)", marginBottom: 24 }}>Gratuito e leva menos de 2 minutos</p>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--red-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
            <h3 style={{ fontFamily: "var(--display)", fontSize: 22 }}>Cadastro Enviado!</h3>
            <p style={{ fontSize: 13, color: "var(--grey)", marginTop: 8 }}>Redirecionando para o catálogo...</p>
          </div>
        ) : (
          <div>
            <Field label="Nome completo" required>
              <input type="text" placeholder="Seu nome" value={form.nome} onChange={set("nome")} style={inputStyle} />
            </Field>
            <Field label="Telefone / WhatsApp" required>
              <input type="tel" placeholder="(12) 99999-0000" value={form.telefone} onChange={set("telefone")} style={inputStyle} />
            </Field>
            <Field label="Serviço prestado" required>
              <input type="text" placeholder="Ex: Pedreiro, Eletricista..." value={form.servico} onChange={set("servico")} style={inputStyle} />
            </Field>
            <Field label="Categoria" required>
              <select value={form.categoria} onChange={set("categoria")} style={{ ...inputStyle, color: form.categoria ? "var(--black)" : "var(--grey-light)" }}>
                <option value="">Selecione...</option>
                {CATS.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.value}</option>)}
              </select>
            </Field>
            <Field label="Bairro">
              <input type="text" placeholder="Ex: Parque dos Sinos" value={form.bairro} onChange={set("bairro")} style={inputStyle} />
            </Field>
            <Field label="Regiões que atende">
              <input type="text" placeholder="Ex: Toda Jacareí" value={form.regioes} onChange={set("regioes")} style={inputStyle} />
            </Field>
            <Field label="Instagram (opcional)">
              <input type="text" placeholder="@seuperfil" value={form.instagram} onChange={set("instagram")} style={inputStyle} />
            </Field>
            <Field label="Tempo de experiência">
              <input type="text" placeholder="Ex: 5 anos" value={form.experiencia} onChange={set("experiencia")} style={inputStyle} />
            </Field>
            <Field label="Descrição do serviço">
              <textarea placeholder="Descreva os serviços que você oferece..." value={form.descricao} onChange={set("descricao")} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </Field>

            {status === "error" && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>Erro ao cadastrar. Tente novamente.</p>}

            <button onClick={submit} disabled={!valid || submitting} style={{
              width: "100%", background: valid ? "var(--red)" : "var(--border)", color: "#fff",
              border: "none", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 700,
              opacity: submitting ? 0.6 : 1, marginTop: 4,
            }}>{submitting ? "Enviando..." : "Cadastrar Profissional"}</button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
