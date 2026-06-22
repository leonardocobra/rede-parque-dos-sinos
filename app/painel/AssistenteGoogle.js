"use client";
import { useState } from "react";
import { track } from "@vercel/analytics";
import { absUrl } from "../../lib/site";
import { adicionarUtm } from "../../lib/utm";
import { registrarEvento } from "../../lib/eventos";
import { dadosGoogleNegocio, CHECKLIST_GBP, GBP_CREATE_URL } from "../../lib/gbp";

// Assistente de Google Business Profile: pega os dados já cadastrados na Rede,
// monta os campos prontos para colar no Google Meu Negócio, lista um checklist
// de otimização e leva ao Google por deep link. Não cria o GBP — a verificação
// é feita pelo próprio profissional no Google.
const CAMPOS = [
  { key: "nome", rotulo: "Nome do negócio" },
  { key: "categoria", rotulo: "Categoria" },
  { key: "areaAtendida", rotulo: "Área atendida" },
  { key: "telefone", rotulo: "Telefone" },
  { key: "descricao", rotulo: "Descrição", multilinha: true },
  { key: "site", rotulo: "Site (seu perfil na Rede)" },
];

export default function AssistenteGoogle({ cadastro }) {
  const [copiado, setCopiado] = useState(null);
  const site = adicionarUtm(absUrl(`/profissional/${cadastro.id}`), "google-business");
  const dados = dadosGoogleNegocio(cadastro, site);

  async function copiar(key, valor) {
    if (!valor) return;
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      const el = document.createElement("textarea");
      el.value = valor;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiado(key);
    setTimeout(() => setCopiado((c) => (c === key ? null : c)), 2000);
  }

  function abrirGoogle() {
    track("gbp_abrir", { id: cadastro.id });
    registrarEvento("funnel_step", { profissional_id: cadastro.id, etapa: "gbp_abrir" });
  }

  return (
    <div className="bg-brand-card rounded-[10px] border border-brand-border p-4 mb-5">
      <h4 className="font-display text-[15px] mb-1">Assistente do Google Meu Negócio</h4>
      <p className="text-[12px] text-brand-grey-light mb-4">
        Seus dados já prontos para colar no Google. Criar o perfil é gratuito e leva cerca de 10
        minutos — a verificação você conclui no próprio Google.
      </p>

      {/* Campos prontos para copiar */}
      <div className="space-y-2.5 mb-4">
        {CAMPOS.map((campo) => {
          const valor = dados[campo.key];
          return (
            <div key={campo.key} className="bg-brand-surface rounded-lg border border-brand-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-brand-grey-light uppercase tracking-[0.6px] mb-0.5">
                    {campo.rotulo}
                  </p>
                  <p
                    className={`text-[13px] text-brand-text ${
                      campo.multilinha ? "leading-relaxed" : "truncate"
                    }`}
                  >
                    {valor || <span className="text-brand-grey-light italic">— não preenchido</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copiar(campo.key, valor)}
                  disabled={!valor}
                  className="shrink-0 bg-brand-card border border-brand-border rounded-lg px-3 py-1.5 text-[11px] font-bold text-brand-grey disabled:opacity-40"
                >
                  {copiado === campo.key ? "Copiado ✓" : "Copiar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão primário: deep link para o Google */}
      <a
        href={GBP_CREATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={abrirGoogle}
        className="block w-full bg-brand-red text-white rounded-lg px-3 py-2.5 text-[13px] font-bold text-center mb-4"
      >
        Criar / gerenciar no Google →
      </a>

      {/* Checklist de otimização */}
      <p className="text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-2">
        Depois de criar, otimize
      </p>
      <div className="space-y-2">
        {CHECKLIST_GBP.map((item) => (
          <div key={item.id} className="bg-brand-surface rounded-lg px-3 py-2.5">
            <span className="text-[13px] font-bold text-brand-text">{item.label}</span>
            <p className="text-[12px] text-brand-grey-light mt-1 leading-relaxed">{item.dica}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
