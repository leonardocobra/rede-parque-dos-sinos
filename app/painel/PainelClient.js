"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getBrowserSupabase } from "../../lib/supabase/client";
import { CATS } from "../config";
import { instagramHandle } from "../../lib/instagram";
import { validarFoto } from "../../lib/avatar";

const FOTO_BUCKET = "fotos-profissionais";

const inputClass =
  "w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-brand-card outline-none text-brand-text";

// Apenas os campos que o dono pode editar (espelha os grants do banco — nunca verificado).
const CAMPOS = [
  "nome",
  "telefone",
  "servico",
  "categoria",
  "bairro",
  "regioes",
  "instagram",
  "experiencia",
  "descricao",
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

// Bloco de métricas do cadastro: visualizações, nº de avaliações, nota média e
// o status dos selos (Recomendado calculado / Verificado manual).
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
            Recomendado: a partir de 3 avaliações com 80% de “contrataria novamente”.
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

function EditarCadastro({ cadastro, stats }) {
  const router = useRouter();
  const init = Object.fromEntries(CAMPOS.map((k) => [k, cadastro[k] || ""]));
  const [form, setForm] = useState(init);
  const [foto, setFoto] = useState(null);
  const [fotoErro, setFotoErro] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | salvando | ok | erro
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valido = form.nome && form.telefone && form.servico && form.categoria;

  function onFoto(e) {
    const file = e.target.files?.[0] || null;
    const { ok, erro } = validarFoto(file);
    setFotoErro(ok ? null : erro);
    setFoto(ok ? file : null);
  }

  async function uploadFoto(supabase) {
    if (!foto) return null;
    const ext = (foto.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(FOTO_BUCKET).upload(path, foto, {
      cacheControl: "3600",
      upsert: false,
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
      servico: form.servico.trim(),
      categoria: form.categoria,
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
    // Revalida o perfil público (ISR) para refletir a edição na hora.
    await fetch("/api/revalidar-perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cadastro.id }),
    }).catch(() => {});
    setStatus("ok");
    setFoto(null);
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

      <h4 className="font-display text-[15px] mb-2">Editar cadastro</h4>

      <Field label="Nome completo">
        <input className={inputClass} value={form.nome} onChange={set("nome")} />
      </Field>
      <Field label="Telefone / WhatsApp">
        <input className={inputClass} value={form.telefone} onChange={set("telefone")} />
      </Field>
      <Field label="Serviço prestado">
        <input className={inputClass} value={form.servico} onChange={set("servico")} />
      </Field>
      <Field label="Categoria">
        <select className={inputClass} value={form.categoria} onChange={set("categoria")}>
          <option value="">Selecione...</option>
          {CATS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.icon} {c.value}
            </option>
          ))}
        </select>
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
      <Field label="Descrição do serviço">
        <textarea
          className={`${inputClass} resize-y`}
          rows={3}
          value={form.descricao}
          onChange={set("descricao")}
        />
      </Field>
      <Field label="Trocar foto (opcional)">
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
    </div>
  );
}

function Reivindicar() {
  const router = useRouter();
  const [telefone, setTelefone] = useState("");
  const [resultados, setResultados] = useState(null); // null = não buscou ainda
  const [status, setStatus] = useState("idle"); // idle | buscando | reivindicando | erro

  async function buscar() {
    const termo = telefone.trim();
    if (termo.length < 4 || status === "buscando") return;
    setStatus("buscando");
    const { data, error } = await getBrowserSupabase()
      .from("profissionais")
      .select("id, nome, telefone, servico, bairro")
      .is("user_id", null)
      .ilike("telefone", `%${termo}%`)
      .limit(10);
    setStatus(error ? "erro" : "idle");
    setResultados(data || []);
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
          disabled={telefone.trim().length < 4 || status === "buscando"}
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
          {resultados.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 border border-brand-border rounded-lg p-3"
            >
              <div className="min-w-0">
                <div className="font-bold text-[14px] truncate">{r.nome}</div>
                <div className="text-[12px] text-brand-grey-light truncate">
                  {r.servico} · {r.telefone}
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
          ))}
        </div>
      )}

      {status === "erro" && (
        <p className="text-brand-red text-[13px] mt-3">Algo deu errado. Tente novamente.</p>
      )}
    </div>
  );
}
