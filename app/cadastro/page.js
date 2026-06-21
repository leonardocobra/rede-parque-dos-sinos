"use client";
import { useState } from "react";
import Link from "next/link";
import Nav from "../components/features/Nav";
import Footer from "../components/features/Footer";
import CropFotoModal from "../components/ui/CropFotoModal";
import { supabase } from "../../lib/supabase";
import { CATS } from "../config";
import { instagramHandle } from "../../lib/instagram";
import { validarFoto } from "../../lib/avatar";

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
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    bairro: "",
    regioes: "",
    instagram: "",
    experiencia: "",
    descricao: "",
  });
  // Lista de pares serviço+categoria (mín 1, máx 3)
  const [servicos, setServicos] = useState([{ servico: "", categoria: "", descricao: "", instagram: "", expandido: false }]);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [fotoErro, setFotoErro] = useState(null);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [novoId, setNovoId] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const servicosValidos = servicos.filter((s) => s.servico && s.categoria);
  const valid = form.nome && form.telefone && servicosValidos.length > 0;

  function atualizarServico(idx, campo, valor) {
    setServicos((prev) => prev.map((s, i) => (i === idx ? { ...s, [campo]: valor } : s)));
  }

  function adicionarServico() {
    if (servicos.length >= 3) return;
    setServicos((prev) => [...prev, { servico: "", categoria: "", descricao: "", instagram: "", expandido: false }]);
  }

  function removerServico(idx) {
    if (servicos.length <= 1) return;
    setServicos((prev) => prev.filter((_, i) => i !== idx));
  }

  function onFoto(e) {
    const file = e.target.files?.[0] || null;
    e.target.value = "";
    const { ok, erro } = validarFoto(file);
    setFotoErro(ok ? null : erro);
    if (ok && file) setCropFile(file);
  }

  function onCrop(blob, url) {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(blob);
    setFotoPreview(url);
    setCropFile(null);
  }

  function removerFoto() {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(null);
    setFotoPreview(null);
  }

  async function uploadFoto() {
    if (!foto) return "";
    const path = `${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(FOTO_BUCKET).upload(path, foto, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/jpeg",
    });
    if (error) return "";
    return supabase.storage.from(FOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function submit() {
    if (!valid || submitting || fotoErro) return;
    setSubmitting(true);
    const foto_url = await uploadFoto();
    const { data, error } = await supabase
      .from("profissionais")
      .insert({
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        bairro: form.bairro.trim(),
        regioes: form.regioes.trim(),
        instagram: instagramHandle(form.instagram) || "",
        experiencia: form.experiencia.trim(),
        descricao: form.descricao.trim(),
        foto_url,
      })
      .select("id")
      .single();
    if (error) {
      setStatus("error");
      setSubmitting(false);
      return;
    }
    const profId = data?.id;
    // Insere cada serviço na tabela dedicada
    if (profId && servicosValidos.length > 0) {
      await supabase.from("profissional_servicos").insert(
        servicosValidos.map((s, idx) => ({
          profissional_id: profId,
          servico: s.servico.trim(),
          categoria: s.categoria,
          ordem: idx,
          descricao: s.descricao?.trim() || null,
          instagram: instagramHandle(s.instagram) || null,
        }))
      );
    }
    setNovoId(profId || null);
    setStatus("success");
  }

  return (
    <>
      <Nav />
      <div className="px-5 py-6 max-w-[500px] mx-auto">
        <h2 className="font-display text-[26px] mb-1">Cadastrar Serviço</h2>
        <p className="text-[13px] text-brand-grey-light mb-6">Gratuito e leva menos de 2 minutos</p>

        {status === "success" ? (
          <div className="py-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-brand-red-light flex items-center justify-center mx-auto mb-4 text-[28px]">
                ✓
              </div>
              <h3 className="font-display text-[22px]">Cadastro Enviado!</h3>
              <p className="text-[13px] text-brand-grey mt-2">Seu serviço já está no catálogo.</p>
            </div>
            <CriarConta novoId={novoId} />
            <p className="text-center mt-5">
              <Link href="/catalogo" className="text-[13px] font-bold text-brand-grey">
                Ir para o catálogo →
              </Link>
            </p>
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

            {/* Serviços — lista dinâmica de até 3 pares serviço+categoria */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-[5px]">
                <label className="text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px]">
                  Serviços *
                </label>
                {servicos.length < 3 && (
                  <button
                    type="button"
                    onClick={adicionarServico}
                    className="text-[11px] font-bold text-brand-red"
                  >
                    + Adicionar
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {servicos.map((s, idx) => (
                  <div key={idx} className="border border-brand-border rounded-lg p-3 space-y-1.5">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Ex: Pedreiro, Eletricista..."
                          value={s.servico}
                          onChange={(e) => atualizarServico(idx, "servico", e.target.value)}
                          className={inputClass}
                        />
                        <select
                          value={s.categoria}
                          onChange={(e) => atualizarServico(idx, "categoria", e.target.value)}
                          className={`${inputClass} ${!s.categoria ? "text-brand-grey-light" : ""}`}
                        >
                          <option value="">Categoria...</option>
                          {CATS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.icon} {c.value}
                            </option>
                          ))}
                        </select>
                      </div>
                      {servicos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerServico(idx)}
                          className="mt-2.5 text-brand-grey-light text-[18px] leading-none shrink-0 px-1"
                          aria-label="Remover serviço"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => atualizarServico(idx, "expandido", !s.expandido)}
                      className="text-[11px] font-bold text-brand-grey-light"
                    >
                      {s.expandido ? "▴ Ocultar detalhes" : "▾ Detalhes opcionais"}
                    </button>
                    {s.expandido && (
                      <div className="space-y-1.5 pt-1">
                        <textarea
                          placeholder="Descrição deste serviço (opcional)"
                          value={s.descricao}
                          onChange={(e) => atualizarServico(idx, "descricao", e.target.value)}
                          rows={2}
                          className={`${inputClass} resize-y`}
                        />
                        <input
                          type="text"
                          placeholder="@seuperfil Instagram (opcional)"
                          value={s.instagram}
                          onChange={(e) => atualizarServico(idx, "instagram", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

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
            <Field label="Instagram principal (opcional)">
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
            <Field label="Sobre você (apresentação geral)">
              <textarea
                placeholder="Uma apresentação geral sua. A descrição de cada serviço fica em cada serviço acima."
                value={form.descricao}
                onChange={set("descricao")}
                rows={3}
                className={`${inputClass} resize-y`}
              />
            </Field>

            <Field label="Foto (opcional)">
              {fotoPreview ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fotoPreview}
                    alt="Prévia da foto"
                    className="w-[56px] h-[56px] rounded-lg object-cover border border-brand-border shrink-0"
                  />
                  <div className="flex gap-3 text-[13px] font-bold">
                    <label className="text-brand-red cursor-pointer">
                      Trocar
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={onFoto}
                        className="hidden"
                      />
                    </label>
                    <button type="button" onClick={removerFoto} className="text-brand-grey">
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onFoto}
                  className="w-full text-[13px] text-brand-grey file:mr-3 file:rounded-md file:border-0 file:bg-brand-surface file:px-3 file:py-2 file:text-[12px] file:font-bold file:text-brand-text"
                />
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
      <CropFotoModal file={cropFile} onCancel={() => setCropFile(null)} onConfirm={onCrop} />
    </>
  );
}

function CriarConta({ novoId }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const valido = /\S+@\S+\.\S+/.test(email);

  async function enviar() {
    if (!valido || status === "enviando") return;
    setStatus("enviando");
    if (novoId) {
      try {
        localStorage.setItem("cadastro_pendente", novoId);
      } catch {
        // localStorage indisponível — segue sem vínculo automático
      }
    }
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setStatus(error ? "erro" : "enviado");
  }

  if (status === "enviado") {
    return (
      <div className="bg-brand-card border border-brand-border rounded-[10px] p-4 text-center">
        <div className="text-[28px] mb-2">✉️</div>
        <h4 className="font-display text-[18px]">Verifique seu e-mail</h4>
        <p className="text-[13px] text-brand-grey mt-1">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra no mesmo dispositivo para
          vincular este cadastro à sua conta.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-card border border-brand-border rounded-[10px] p-4">
      <h4 className="font-display text-[18px] mb-1">Quer poder editar depois?</h4>
      <p className="text-[13px] text-brand-grey-light mb-3">
        Crie uma conta por e-mail (sem senha) e este cadastro fica vinculado a você — dá para
        corrigir telefone, foto e descrição quando quiser.
      </p>
      <div className="flex gap-2">
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
        <button
          onClick={enviar}
          disabled={!valido || status === "enviando"}
          className="bg-brand-red text-white rounded-lg px-4 text-[14px] font-bold shrink-0 disabled:bg-brand-border"
        >
          {status === "enviando" ? "..." : "Criar conta"}
        </button>
      </div>
      {status === "erro" && (
        <p className="text-brand-red text-[13px] mt-2">
          Não foi possível enviar o link. Tente novamente.
        </p>
      )}
    </div>
  );
}
