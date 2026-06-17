"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import { CATS } from "../config";
import { instagramHandle } from "../../lib/instagram";
import { validarFoto } from "../../lib/avatar";

// Bucket público no Supabase Storage onde ficam as fotos dos profissionais.
const FOTO_BUCKET = "fotos-profissionais";

function Field({ label, required, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-[5px]">
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-brand-card outline-none text-brand-text";

export default function Cadastro() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    servico: "",
    categoria: "",
    bairro: "",
    regioes: "",
    instagram: "",
    experiencia: "",
    descricao: "",
  });
  const [foto, setFoto] = useState(null);
  const [fotoErro, setFotoErro] = useState(null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.nome && form.telefone && form.servico && form.categoria;

  function onFoto(e) {
    const file = e.target.files?.[0] || null;
    const { ok, erro } = validarFoto(file);
    setFotoErro(ok ? null : erro);
    setFoto(ok ? file : null);
  }

  // Envia a foto para o Storage e devolve a URL pública (ou "" em caso de falha).
  async function uploadFoto() {
    if (!foto) return "";
    const ext = (foto.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(FOTO_BUCKET).upload(path, foto, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) return "";
    return supabase.storage.from(FOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function submit() {
    if (!valid || submitting || fotoErro) return;
    setSubmitting(true);
    const foto_url = await uploadFoto();
    const { error } = await supabase.from("profissionais").insert({
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      servico: form.servico.trim(),
      categoria: form.categoria,
      bairro: form.bairro.trim(),
      regioes: form.regioes.trim(),
      instagram: instagramHandle(form.instagram) || "",
      experiencia: form.experiencia.trim(),
      descricao: form.descricao.trim(),
      foto_url,
    });
    if (error) {
      setStatus("error");
      setSubmitting(false);
      return;
    }
    setStatus("success");
    setTimeout(() => router.push("/catalogo"), 2000);
  }

  return (
    <>
      <Nav />
      <div className="px-5 py-6 max-w-[500px] mx-auto">
        <h2 className="font-display text-[26px] mb-1">Cadastrar Serviço</h2>
        <p className="text-[13px] text-brand-grey-light mb-6">Gratuito e leva menos de 2 minutos</p>

        {status === "success" ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-brand-red-light flex items-center justify-center mx-auto mb-4 text-[28px]">
              ✓
            </div>
            <h3 className="font-display text-[22px]">Cadastro Enviado!</h3>
            <p className="text-[13px] text-brand-grey mt-2">Redirecionando para o catálogo...</p>
          </div>
        ) : (
          <div>
            <Field label="Nome completo" required>
              <input
                type="text"
                placeholder="Seu nome"
                value={form.nome}
                onChange={set("nome")}
                className={inputClass}
              />
            </Field>
            <Field label="Telefone / WhatsApp" required>
              <input
                type="tel"
                placeholder="(12) 99999-0000"
                value={form.telefone}
                onChange={set("telefone")}
                className={inputClass}
              />
            </Field>
            <Field label="Serviço prestado" required>
              <input
                type="text"
                placeholder="Ex: Pedreiro, Eletricista..."
                value={form.servico}
                onChange={set("servico")}
                className={inputClass}
              />
            </Field>
            <Field label="Categoria" required>
              <select
                value={form.categoria}
                onChange={set("categoria")}
                className={`${inputClass} ${!form.categoria ? "text-brand-grey-light" : ""}`}
              >
                <option value="">Selecione...</option>
                {CATS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.value}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bairro">
              <input
                type="text"
                placeholder="Ex: Parque dos Sinos"
                value={form.bairro}
                onChange={set("bairro")}
                className={inputClass}
              />
            </Field>
            <Field label="Regiões que atende">
              <input
                type="text"
                placeholder="Ex: Toda Jacareí"
                value={form.regioes}
                onChange={set("regioes")}
                className={inputClass}
              />
            </Field>
            <Field label="Instagram (opcional)">
              <input
                type="text"
                placeholder="@seuperfil"
                value={form.instagram}
                onChange={set("instagram")}
                className={inputClass}
              />
            </Field>
            <Field label="Tempo de experiência">
              <input
                type="text"
                placeholder="Ex: 5 anos"
                value={form.experiencia}
                onChange={set("experiencia")}
                className={inputClass}
              />
            </Field>
            <Field label="Descrição do serviço">
              <textarea
                placeholder="Descreva os serviços que você oferece..."
                value={form.descricao}
                onChange={set("descricao")}
                rows={3}
                className={`${inputClass} resize-y`}
              />
            </Field>

            <Field label="Foto (opcional)">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFoto}
                className="w-full text-[13px] text-brand-grey file:mr-3 file:rounded-md file:border-0 file:bg-brand-surface file:px-3 file:py-2 file:text-[12px] file:font-bold file:text-brand-text"
              />
              {foto && !fotoErro && (
                <p className="text-[11px] text-brand-grey-light mt-1.5">Selecionada: {foto.name}</p>
              )}
              {fotoErro && <p className="text-brand-red text-[12px] mt-1.5">{fotoErro}</p>}
              <p className="text-[11px] text-brand-grey-light mt-1.5">
                Uma foto sua ou do seu trabalho gera mais confiança. JPG, PNG ou WebP, até 2 MB.
              </p>
            </Field>

            {status === "error" && (
              <p className="text-brand-red text-[13px] mb-3">Erro ao cadastrar. Tente novamente.</p>
            )}

            <button
              onClick={submit}
              disabled={!valid || submitting || !!fotoErro}
              className={`w-full ${
                valid ? "bg-brand-red" : "bg-brand-border"
              } text-white border-none rounded-lg py-3.5 text-[15px] font-bold mt-1 ${
                submitting ? "opacity-60" : ""
              }`}
            >
              {submitting ? "Enviando..." : "Cadastrar Profissional"}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
