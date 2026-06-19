"use client";
import { useState } from "react";
import { getBrowserSupabase } from "../../lib/supabase/client";
import { validarFoto } from "../../lib/avatar";
import { MAX_ITENS, PRECO_TIPOS, resumoItem, validarItem } from "../../lib/itens";
import CropFotoModal from "../components/CropFotoModal";

const FOTO_BUCKET = "fotos-profissionais";

const inputClass =
  "w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-brand-card outline-none text-brand-text";

const FORM_VAZIO = {
  titulo: "",
  descricao: "",
  preco: "",
  preco_tipo: "a_partir",
  disponibilidade: "",
};

// Gestão dos itens de UM serviço. `onCount` informa o pai a quantidade atual
// (para o resumo no card do serviço); `onRevalidar` revalida o perfil público.
//
// A edição acontece numa tela dedicada (lista some, editor aparece): no celular
// isso evita um card denso com foto + preço + disponibilidade tudo inline.
export default function GerenciarItens({ servico, profissionalId, onCount, onRevalidar }) {
  const [itens, setItens] = useState(
    [...(servico.profissional_itens || [])].sort((a, b) => a.ordem - b.ordem)
  );
  const [editando, setEditando] = useState(null); // null | "novo" | item.id
  const [form, setForm] = useState(FORM_VAZIO);
  const [foto, setFoto] = useState(null); // blob da nova foto (se trocada)
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoAtual, setFotoAtual] = useState(null); // url já salva (em edição)
  const [cropFile, setCropFile] = useState(null);
  const [fotoErro, setFotoErro] = useState(null);
  const [status, setStatus] = useState("idle");

  function atualizarItens(proximos) {
    setItens(proximos);
    onCount?.(proximos.length);
  }

  function abrirNovo() {
    setForm(FORM_VAZIO);
    resetFoto();
    setFotoAtual(null);
    setStatus("idle");
    setEditando("novo");
  }

  function abrirEdicao(item) {
    setForm({
      titulo: item.titulo || "",
      descricao: item.descricao || "",
      preco: item.preco === null || item.preco === undefined ? "" : String(item.preco),
      preco_tipo: item.preco_tipo || "a_partir",
      disponibilidade: item.disponibilidade || "",
    });
    resetFoto();
    setFotoAtual(item.foto_url || null);
    setStatus("idle");
    setEditando(item.id);
  }

  function fechar() {
    resetFoto();
    setEditando(null);
  }

  function resetFoto() {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(null);
    setFotoPreview(null);
    setFotoErro(null);
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
    resetFoto();
    setFotoAtual(null);
  }

  async function uploadFoto(supabase) {
    if (!foto) return null;
    const path = `${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(FOTO_BUCKET).upload(path, foto, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/jpeg",
    });
    if (error) return null;
    return supabase.storage.from(FOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function salvar() {
    const { ok } = validarItem(form);
    if (!ok || fotoErro || status === "salvando") return;
    setStatus("salvando");
    const supabase = getBrowserSupabase();

    const novaFotoUrl = await uploadFoto(supabase);
    // foto_url final: nova foto > foto que já estava > null (removida).
    const fotoUrl = novaFotoUrl || fotoAtual || null;

    const precoNum = form.preco === "" ? null : Number(form.preco);
    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      foto_url: fotoUrl,
      preco: Number.isFinite(precoNum) ? precoNum : null,
      preco_tipo: form.preco_tipo,
      disponibilidade: form.disponibilidade.trim() || null,
    };

    if (editando === "novo") {
      const { data, error } = await supabase
        .from("profissional_itens")
        .insert({
          ...payload,
          servico_id: servico.id,
          profissional_id: profissionalId,
          ordem: itens.length,
        })
        .select()
        .single();
      if (error) {
        setStatus("erro");
        return;
      }
      atualizarItens([...itens, data]);
    } else {
      const { error } = await supabase
        .from("profissional_itens")
        .update(payload)
        .eq("id", editando);
      if (error) {
        setStatus("erro");
        return;
      }
      atualizarItens(itens.map((i) => (i.id === editando ? { ...i, ...payload } : i)));
    }

    onRevalidar?.();
    fechar();
  }

  async function remover(id) {
    if (!window.confirm("Remover este item?")) return;
    setStatus("removendo");
    const supabase = getBrowserSupabase();
    const { error } = await supabase.from("profissional_itens").delete().eq("id", id);
    if (error) {
      setStatus("erro");
      return;
    }
    atualizarItens(itens.filter((i) => i.id !== id));
    setStatus("idle");
    onRevalidar?.();
  }

  const fotoMostrada = fotoPreview || fotoAtual;

  if (editando) {
    return (
      <div className="mt-2 border border-brand-border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={fechar}
            aria-label="Voltar"
            className="text-brand-grey text-[18px] leading-none"
          >
            ←
          </button>
          <h5 className="font-display text-[14px]">
            {editando === "novo" ? "Novo item" : "Editar item"}
          </h5>
          <span className="ml-auto text-[11px] text-brand-grey-light truncate max-w-[45%]">
            {servico.servico}
          </span>
        </div>

        <div className="space-y-2">
          <div>
            {fotoMostrada ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoMostrada}
                  alt="Foto do item"
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
          </div>

          <input
            className={inputClass}
            placeholder="Título do item (ex: Bolo vulcão)"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
          <textarea
            className={`${inputClass} resize-y`}
            rows={2}
            placeholder="Descrição (opcional)"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
          />

          <div className="flex flex-wrap gap-1.5">
            {PRECO_TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, preco_tipo: t.value }))}
                className={`px-2.5 py-[5px] rounded-[6px] text-[12px] font-bold ${
                  form.preco_tipo === t.value
                    ? "bg-brand-red text-white"
                    : "bg-brand-surface text-brand-grey border border-brand-border"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {form.preco_tipo !== "sob_orcamento" && (
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="Preço em R$ (opcional)"
              value={form.preco}
              onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))}
            />
          )}

          <input
            className={inputClass}
            placeholder="Disponibilidade (ex: pronta entrega) — opcional"
            value={form.disponibilidade}
            onChange={(e) => setForm((f) => ({ ...f, disponibilidade: e.target.value }))}
          />

          <div className="flex gap-2 pt-1">
            <button
              onClick={salvar}
              disabled={!form.titulo.trim() || !!fotoErro || status === "salvando"}
              className="bg-brand-red text-white rounded-lg px-3 py-1.5 text-[12px] font-bold disabled:bg-brand-border"
            >
              {status === "salvando" ? "Salvando..." : "Salvar item"}
            </button>
            <button onClick={fechar} className="text-[12px] text-brand-grey font-bold">
              Cancelar
            </button>
          </div>
          {status === "erro" && (
            <p className="text-brand-red text-[12px]">Erro ao salvar. Tente novamente.</p>
          )}
        </div>

        <CropFotoModal file={cropFile} onCancel={() => setCropFile(null)} onConfirm={onCrop} />
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      {itens.length === 0 && (
        <p className="text-[12px] text-brand-grey-light">
          Nenhum item ainda. Mostre o que você oferece com foto e preço.
        </p>
      )}

      {itens.map((item) => {
        const resumo = resumoItem(item);
        return (
          <div
            key={item.id}
            className="flex items-center gap-3 border border-brand-border rounded-lg p-2"
          >
            {item.foto_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.foto_url}
                alt=""
                className="w-[42px] h-[42px] rounded-md object-cover border border-brand-border shrink-0"
              />
            ) : (
              <div className="w-[42px] h-[42px] rounded-md bg-brand-surface shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold truncate">{item.titulo}</div>
              {resumo && (
                <div className="text-[12px] text-brand-grey-light truncate">{resumo}</div>
              )}
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => abrirEdicao(item)}
                className="text-[12px] text-brand-grey font-bold"
              >
                Editar
              </button>
              <button
                onClick={() => remover(item.id)}
                disabled={status === "removendo"}
                className="text-[12px] text-brand-red font-bold disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          </div>
        );
      })}

      {itens.length < MAX_ITENS && (
        <button
          onClick={abrirNovo}
          className="w-full border border-dashed border-brand-border rounded-lg py-2 text-[12px] text-brand-red font-bold"
        >
          + Adicionar item
        </button>
      )}
    </div>
  );
}
