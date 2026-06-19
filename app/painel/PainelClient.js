"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "../../lib/supabase/client";
import { CATS } from "../config";
import { instagramHandle } from "../../lib/instagram";
import { validarFoto } from "../../lib/avatar";
import { soDigitos, filtrarPorTelefone } from "../../lib/telefone";
import CropFotoModal from "../components/CropFotoModal";
import DivulgarPorCanal from "../components/DivulgarPorCanal";

const FOTO_BUCKET = "fotos-profissionais";

const inputClass =
  "w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-brand-card outline-none text-brand-text";

// Campos do profissional editáveis pelo dono (servico/categoria foram para profissional_servicos).
const CAMPOS = [
  "nome", "telefone", "bairro", "regioes", "instagram", "experiencia", "descricao",
];

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-[5px]">
        {label}
      </label>
      {children}
    </div>
  );
}

async function revalidarPerfil(id) {
  await fetch("/api/revalidar-perfil", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch(() => {});
}

export default function PainelClient({ cadastros, stats = {} }) {
  if (cadastros.length === 0) {
    return <Reivindicar />;
  }
  return (
    <div className="space-y-6">
      {cadastros.map((c) => (
        <EditarCadastro key={c.id} cadastro={c} stats={stats[c.id]} />
      ))}
    </div>
  );
}

function Metricas({ cadastro, stats }) {
  const visualizacoes = cadastro.visualizacoes || 0;
  const totalAvaliacoes = stats?.count || 0;
  const notaMedia = stats ? stats.avg.toFixed(1).replace(".", ",") : "—";

  return (
    <div className="mb-4">
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat valor={visualizacoes} rotulo="Visualizações" />
        <Stat valor={totalAvaliacoes} rotulo="Avaliações" />
        <Stat valor={notaMedia} rotulo="Nota média" />
      </div>
      <div className="space-y-1.5">
        {stats?.recomendado ? (
          <p className="text-[12px] font-bold text-brand-red">Você é Recomendado ✓</p>
        ) : (
          <p className="text-[12px] text-brand-grey-light">
            Recomendado: a partir de 3 avaliações com 80% de &ldquo;contrataria novamente&rdquo;.
          </p>
        )}
        {cadastro.verificado ? (
          <p className="text-[12px] font-bold text-brand-text">Identidade verificada ✓</p>
        ) : (
          <p className="text-[12px] text-brand-grey-light">
            Verificação: pendente — fale com a Rede.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ valor, rotulo }) {
  return (
    <div className="bg-brand-surface rounded-lg py-2.5 px-2 text-center">
      <div className="font-display text-[20px] leading-none text-brand-text">{valor}</div>
      <div className="text-[10px] text-brand-grey-light uppercase tracking-[0.5px] mt-1">
        {rotulo}
      </div>
    </div>
  );
}

function GerenciarServicos({ cadastro }) {
  const [servicos, setServicos] = useState(
    (cadastro.profissional_servicos || []).sort((a, b) => a.ordem - b.ordem)
  );
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ servico: "", categoria: "", descricao: "", instagram: "" });
  const [novoForm, setNovoForm] = useState({ servico: "", categoria: "", descricao: "", instagram: "" });
  const [mostraAdicionar, setMostraAdicionar] = useState(false);
  const [statusOp, setStatusOp] = useState({});

  function iniciarEdicao(s) {
    setEditandoId(s.id);
    setEditForm({ servico: s.servico, categoria: s.categoria, descricao: s.descricao || "", instagram: s.instagram || "" });
  }

  async function salvarEdicao(id) {
    if (!editForm.servico || !editForm.categoria) return;
    setStatusOp((prev) => ({ ...prev, [id]: "salvando" }));
    const supabase = getBrowserSupabase();
    const { error } = await supabase
      .from("profissional_servicos")
      .update({
        servico: editForm.servico.trim(),
        categoria: editForm.categoria,
        descricao: editForm.descricao.trim() || null,
        instagram: instagramHandle(editForm.instagram) || null,
      })
      .eq("id", id);
    if (error) {
      setStatusOp((prev) => ({ ...prev, [id]: "erro" }));
      return;
    }
    setServicos((prev) =>
      prev.map((sv) =>
        sv.id === id
          ? { ...sv, ...editForm, servico: editForm.servico.trim(), descricao: editForm.descricao.trim() || null, instagram: instagramHandle(editForm.instagram) || null }
          : sv
      )
    );
    setEditandoId(null);
    setStatusOp((prev) => ({ ...prev, [id]: null }));
    revalidarPerfil(cadastro.id);
  }

  async function remover(id) {
    const supabase = getBrowserSupabase();
    const { count } = await supabase
      .from("avaliacoes")
      .select("id", { count: "exact", head: true })
      .eq("servico_id", id);
    const aviso =
      count > 0
        ? `Este serviço tem ${count} avaliação(ões). Ao remover, elas serão exibidas como "Geral".\n\nDeseja remover mesmo assim?`
        : "Remover este serviço?";
    if (!window.confirm(aviso)) return;
    setStatusOp((prev) => ({ ...prev, [id]: "removendo" }));
    const { error } = await supabase.from("profissional_servicos").delete().eq("id", id);
    if (error) {
      setStatusOp((prev) => ({ ...prev, [id]: "erro" }));
      return;
    }
    setServicos((prev) => prev.filter((sv) => sv.id !== id));
    setStatusOp((prev) => ({ ...prev, [id]: null }));
    revalidarPerfil(cadastro.id);
  }

  async function adicionar() {
    if (!novoForm.servico || !novoForm.categoria) return;
    setStatusOp((prev) => ({ ...prev, novo: "salvando" }));
    const supabase = getBrowserSupabase();
    const { data, error } = await supabase
      .from("profissional_servicos")
      .insert({
        profissional_id: cadastro.id,
        servico: novoForm.servico.trim(),
        categoria: novoForm.categoria,
        ordem: servicos.length,
        descricao: novoForm.descricao.trim() || null,
        instagram: instagramHandle(novoForm.instagram) || null,
      })
      .select()
      .single();
    if (error) {
      setStatusOp((prev) => ({ ...prev, novo: "erro" }));
      return;
    }
    setServicos((prev) => [...prev, data]);
    setNovoForm({ servico: "", categoria: "" });
    setMostraAdicionar(false);
    setStatusOp((prev) => ({ ...prev, novo: null }));
    revalidarPerfil(cadastro.id);
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-display text-[15px]">Meus Serviços</h4>
        {servicos.length < 3 && !mostraAdicionar && (
          <button
            onClick={() => setMostraAdicionar(true)}
            className="text-[12px] text-brand-red font-bold"
          >
            + Adicionar
          </button>
        )}
      </div>

      <div className="space-y-2">
        {servicos.map((s) => (
          <div key={s.id} className="border border-brand-border rounded-lg p-3">
            {editandoId === s.id ? (
              <div className="space-y-2">
                <input
                  className={inputClass}
                  value={editForm.servico}
                  onChange={(e) => setEditForm((f) => ({ ...f, servico: e.target.value }))}
                  placeholder="Serviço"
                />
                <select
                  className={inputClass}
                  value={editForm.categoria}
                  onChange={(e) => setEditForm((f) => ({ ...f, categoria: e.target.value }))}
                >
                  <option value="">Selecione a categoria...</option>
                  {CATS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.value}
                    </option>
                  ))}
                </select>
                <textarea
                  className={`${inputClass} resize-y`}
                  rows={2}
                  placeholder="Descrição do serviço (opcional)"
                  value={editForm.descricao}
                  onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
                />
                <input
                  className={inputClass}
                  placeholder="@seuperfil Instagram (opcional)"
                  value={editForm.instagram}
                  onChange={(e) => setEditForm((f) => ({ ...f, instagram: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => salvarEdicao(s.id)}
                    disabled={
                      !editForm.servico ||
                      !editForm.categoria ||
                      statusOp[s.id] === "salvando"
                    }
                    className="bg-brand-red text-white rounded-lg px-3 py-1.5 text-[12px] font-bold disabled:bg-brand-border"
                  >
                    {statusOp[s.id] === "salvando" ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="text-[12px] text-brand-grey font-bold"
                  >
                    Cancelar
                  </button>
                </div>
                {statusOp[s.id] === "erro" && (
                  <p className="text-brand-red text-[12px]">Erro ao salvar. Tente novamente.</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[14px] font-bold">{s.servico}</div>
                  <div className="text-[12px] text-brand-grey-light">{s.categoria}</div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => iniciarEdicao(s)}
                    className="text-[12px] text-brand-grey font-bold"
                  >
                    Editar
                  </button>
                  {servicos.length > 1 && (
                    <button
                      onClick={() => remover(s.id)}
                      disabled={statusOp[s.id] === "removendo"}
                      className="text-[12px] text-brand-red font-bold disabled:opacity-50"
                    >
                      {statusOp[s.id] === "removendo" ? "..." : "Remover"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {mostraAdicionar && (
        <div className="mt-2 border border-brand-border rounded-lg p-3 space-y-2">
          <input
            className={inputClass}
            value={novoForm.servico}
            onChange={(e) => setNovoForm((f) => ({ ...f, servico: e.target.value }))}
            placeholder="Ex: Pintor, Diarista..."
          />
          <select
            className={inputClass}
            value={novoForm.categoria}
            onChange={(e) => setNovoForm((f) => ({ ...f, categoria: e.target.value }))}
          >
            <option value="">Selecione a categoria...</option>
            {CATS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.value}
              </option>
            ))}
          </select>
          <textarea
            className={`${inputClass} resize-y`}
            rows={2}
            placeholder="Descrição do serviço (opcional)"
            value={novoForm.descricao}
            onChange={(e) => setNovoForm((f) => ({ ...f, descricao: e.target.value }))}
          />
          <input
            className={inputClass}
            placeholder="@seuperfil Instagram (opcional)"
            value={novoForm.instagram}
            onChange={(e) => setNovoForm((f) => ({ ...f, instagram: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              onClick={adicionar}
              disabled={!novoForm.servico || !novoForm.categoria || statusOp.novo === "salvando"}
              className="bg-brand-red text-white rounded-lg px-3 py-1.5 text-[12px] font-bold disabled:bg-brand-border"
            >
              {statusOp.novo === "salvando" ? "Adicionando..." : "Adicionar"}
            </button>
            <button
              onClick={() => {
                setMostraAdicionar(false);
                setNovoForm({ servico: "", categoria: "", descricao: "", instagram: "" });
              }}
              className="text-[12px] text-brand-grey font-bold"
            >
              Cancelar
            </button>
          </div>
          {statusOp.novo === "erro" && (
            <p className="text-brand-red text-[12px]">Erro ao adicionar. Tente novamente.</p>
          )}
        </div>
      )}
    </div>
  );
}

function EditarCadastro({ cadastro, stats }) {
  const router = useRouter();
  const init = Object.fromEntries(CAMPOS.map((k) => [k, cadastro[k] || ""]));
  const [form, setForm] = useState(init);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [fotoErro, setFotoErro] = useState(null);
  const [status, setStatus] = useState("idle");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valido = form.nome && form.telefone;

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
    if (!valido || status === "salvando" || fotoErro) return;
    setStatus("salvando");
    const supabase = getBrowserSupabase();

    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      bairro: form.bairro.trim(),
      regioes: form.regioes.trim(),
      instagram: instagramHandle(form.instagram) || "",
      experiencia: form.experiencia.trim(),
      descricao: form.descricao.trim(),
    };

    const fotoUrl = await uploadFoto(supabase);
    if (fotoUrl) payload.foto_url = fotoUrl;

    const { error } = await supabase.from("profissionais").update(payload).eq("id", cadastro.id);
    if (error) {
      setStatus("erro");
      return;
    }
    await revalidarPerfil(cadastro.id);
    setStatus("ok");
    removerFoto();
    router.refresh();
  }

  return (
    <div className="bg-brand-card rounded-[10px] border border-brand-border p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-display text-[18px]">{cadastro.nome || "Seu cadastro"}</h3>
        {cadastro.verificado && (
          <span className="bg-brand-black text-white font-bold text-[10px] px-2 py-[3px] rounded-[4px] uppercase tracking-[0.6px]">
            ✓ Verificado
          </span>
        )}
      </div>

      <Metricas cadastro={cadastro} stats={stats} />

      <DivulgarPorCanal id={cadastro.id} />

      <GerenciarServicos cadastro={cadastro} />

      <h4 className="font-display text-[15px] mb-2">Editar cadastro</h4>

      <Field label="Nome completo">
        <input className={inputClass} value={form.nome} onChange={set("nome")} />
      </Field>
      <Field label="Telefone / WhatsApp">
        <input className={inputClass} value={form.telefone} onChange={set("telefone")} />
      </Field>
      <Field label="Bairro">
        <input className={inputClass} value={form.bairro} onChange={set("bairro")} />
      </Field>
      <Field label="Regiões que atende">
        <input className={inputClass} value={form.regioes} onChange={set("regioes")} />
      </Field>
      <Field label="Instagram">
        <input className={inputClass} value={form.instagram} onChange={set("instagram")} />
      </Field>
      <Field label="Tempo de experiência">
        <input className={inputClass} value={form.experiencia} onChange={set("experiencia")} />
      </Field>
      <Field label="Sobre você (apresentação geral)">
        <textarea
          className={`${inputClass} resize-y`}
          rows={3}
          placeholder="Uma apresentação geral sua. A descrição de cada serviço fica em 'Meus Serviços' acima."
          value={form.descricao}
          onChange={set("descricao")}
        />
      </Field>
      <Field label="Trocar foto (opcional)">
        {fotoPreview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoPreview}
              alt="Prévia da nova foto"
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
      </Field>

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={salvar}
          disabled={!valido || status === "salvando" || !!fotoErro}
          className={`${
            valido ? "bg-brand-red" : "bg-brand-border"
          } text-white border-none rounded-lg py-3 px-6 text-[14px] font-bold ${
            status === "salvando" ? "opacity-60" : ""
          }`}
        >
          {status === "salvando" ? "Salvando..." : "Salvar alterações"}
        </button>
        <Link
          href={`/profissional/${cadastro.id}`}
          className="text-[12px] font-bold text-brand-grey"
        >
          Ver meu perfil →
        </Link>
      </div>
      {status === "ok" && <p className="text-brand-red text-[13px] mt-3">Alterações salvas!</p>}
      {status === "erro" && (
        <p className="text-brand-red text-[13px] mt-3">Não foi possível salvar. Tente novamente.</p>
      )}
      <CropFotoModal file={cropFile} onCancel={() => setCropFile(null)} onConfirm={onCrop} />
    </div>
  );
}

function Reivindicar() {
  const router = useRouter();
  const [telefone, setTelefone] = useState("");
  const [resultados, setResultados] = useState(null);
  const [status, setStatus] = useState("idle");

  async function buscar() {
    // Compara só os dígitos: o telefone é salvo cru no cadastro (com ou sem
    // formatação), então um ilike literal falharia por diferença de máscara.
    const digitos = soDigitos(telefone);
    if (digitos.length < 4 || status === "buscando") return;
    setStatus("buscando");
    const { data, error } = await getBrowserSupabase()
      .from("profissionais")
      .select("id, nome, telefone, bairro, profissional_servicos(servico)")
      .is("user_id", null)
      .limit(500);
    setStatus(error ? "erro" : "idle");
    setResultados(filtrarPorTelefone(data, telefone).slice(0, 10));
  }

  async function reivindicar(id) {
    setStatus("reivindicando");
    const supabase = getBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profissionais")
      .update({ user_id: user.id })
      .eq("id", id)
      .is("user_id", null);
    if (error) {
      setStatus("erro");
      return;
    }
    router.refresh();
  }

  return (
    <div className="bg-brand-card rounded-[10px] border border-brand-border p-4">
      <h3 className="font-display text-[18px] mb-1">Encontrar seu cadastro</h3>
      <p className="text-[13px] text-brand-grey-light mb-4">
        Você ainda não tem um cadastro vinculado a esta conta. Busque pelo telefone usado no
        cadastro para reivindicá-lo — ou{" "}
        <Link href="/cadastro" className="text-brand-red font-bold">
          faça um novo cadastro
        </Link>
        .
      </p>

      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="Seu telefone (ex: 99999-0000)"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
        />
        <button
          onClick={buscar}
          disabled={soDigitos(telefone).length < 4 || status === "buscando"}
          className="bg-brand-red text-white rounded-lg px-4 text-[14px] font-bold shrink-0 disabled:bg-brand-border"
        >
          {status === "buscando" ? "..." : "Buscar"}
        </button>
      </div>

      {resultados && resultados.length === 0 && (
        <p className="text-[13px] text-brand-grey-light mt-4">
          Nenhum cadastro sem dono encontrado com esse telefone.
        </p>
      )}

      {resultados && resultados.length > 0 && (
        <div className="space-y-2 mt-4">
          {resultados.map((r) => {
            const nomeServicos = (r.profissional_servicos || [])
              .map((s) => s.servico)
              .join(", ");
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 border border-brand-border rounded-lg p-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-[14px] truncate">{r.nome}</div>
                  <div className="text-[12px] text-brand-grey-light truncate">
                    {nomeServicos} · {r.telefone}
                  </div>
                </div>
                <button
                  onClick={() => reivindicar(r.id)}
                  disabled={status === "reivindicando"}
                  className="bg-brand-black text-white rounded-lg px-3 py-2 text-[12px] font-bold shrink-0"
                >
                  É meu
                </button>
              </div>
            );
          })}
        </div>
      )}

      {status === "erro" && (
        <p className="text-brand-red text-[13px] mt-3">Algo deu errado. Tente novamente.</p>
      )}
    </div>
  );
}
