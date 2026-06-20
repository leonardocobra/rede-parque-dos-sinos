"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";
import { absUrl } from "../../lib/site";
import { registrarEvento } from "../../lib/eventos";
import { track } from "@vercel/analytics";

function Toggle({ label, value, onChange }) {
  return (
    <div className="mb-4">
      <div className="text-[13px] text-brand-grey mb-2">{label}</div>
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            onClick={() => onChange(v)}
            className={`flex-1 py-2.5 rounded-[6px] text-[13px] font-bold transition-all duration-150 border-[1.5px] ${
              value === v
                ? v
                  ? "bg-brand-black text-white border-brand-black"
                  : "bg-brand-red text-white border-brand-red"
                : "bg-brand-card text-brand-grey border-brand-border"
            }`}
          >
            {v ? "Sim" : "Não"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Avaliar() {
  return (
    <Suspense>
      <AvaliarContent />
    </Suspense>
  );
}

function AvaliarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preId = searchParams.get("id");
  const preNome = searchParams.get("nome");

  const [profs, setProfs] = useState([]);
  const [profId, setProfId] = useState(preId || "");
  const [servicoId, setServicoId] = useState("");
  const [pontual, setPontual] = useState(null);
  const [novamente, setNovamente] = useState(null);
  const [conforme, setConforme] = useState(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [compartilhado, setCompartilhado] = useState(false);

  useEffect(() => {
    supabase
      .from("profissionais")
      .select("id, nome, profissional_servicos(id, servico, ordem)")
      .order("nome")
      .then(({ data }) => {
        const sorted = (data || []).map((p) => ({
          ...p,
          profissional_servicos: (p.profissional_servicos || []).sort((a, b) => a.ordem - b.ordem),
        }));
        setProfs(sorted);
      });
  }, []);

  // Serviços do profissional selecionado
  const servicosDoProf = profId
    ? (profs.find((p) => p.id === profId)?.profissional_servicos || [])
    : [];

  // Auto-seleciona o serviço quando há apenas um
  useEffect(() => {
    if (servicosDoProf.length === 1) {
      setServicoId(servicosDoProf[0].id);
    } else {
      setServicoId("");
    }
  }, [profId]);

  const precisaEscolherServico = servicosDoProf.length > 1;
  const valid =
    profId &&
    pontual !== null &&
    novamente !== null &&
    conforme !== null &&
    (!precisaEscolherServico || servicoId);

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("avaliacoes").insert({
      profissional_id: profId,
      servico_id: servicoId || null,
      pontual,
      novamente,
      conforme,
      nota,
      comentario: comentario.trim(),
    });
    if (error) {
      setStatus("error");
      setSubmitting(false);
      return;
    }
    setStatus("success");
  }

  return (
    <>
      <Nav />
      <div className="px-5 py-6 max-w-[500px] mx-auto">
        <h2 className="font-display text-[26px] mb-1">Avaliar Profissional</h2>
        <p className="text-[13px] text-brand-grey-light mb-6">
          Sua avaliação ajuda outros moradores
        </p>

        {status === "success" ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-brand-red-light flex items-center justify-center mx-auto mb-4 text-[28px]">
              ✓
            </div>
            <h3 className="font-display text-[22px]">Avaliação Enviada!</h3>
            <p className="text-[13px] text-brand-grey mt-2">
              Obrigado por contribuir com a comunidade.
            </p>
            <div className="mt-6 bg-brand-card border border-brand-border rounded-[10px] p-4 text-left">
              <p className="text-[13px] font-bold text-brand-text mb-1">
                Conhece alguém que precisaria desse profissional?
              </p>
              <p className="text-[12px] text-brand-grey-light mb-3">
                Indique para um vizinho — leva 10 segundos.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const nomePro = profs.find((p) => p.id === profId)?.nome || "";
                  const url = absUrl(`/profissional/${profId}`);
                  // O card do preview já mostra nome/serviço/cidade/foto; a
                  // mensagem traz só a prova social ("acabei de avaliar") + nome.
                  const mensagem = `Acabei de avaliar ${nomePro} e recomendo o trabalho! 👇`;
                  const usaNativo = typeof navigator !== "undefined" && !!navigator.share;
                  track("perfil_share", { canal: "pos_avaliacao", id: profId });
                  // Mesmo canal real do compartilhamento (nativo vs whatsapp) para
                  // a quebra por canal do referral no /admin.
                  registrarEvento("share_pos_avaliacao", {
                    profissional_id: profId,
                    canal: usaNativo ? "nativo" : "whatsapp",
                  });
                  setCompartilhado(true);
                  if (usaNativo) {
                    try {
                      await navigator.share({ text: mensagem, url });
                      return;
                    } catch {
                      // cancelado — fallback WhatsApp
                    }
                  }
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(`${mensagem}\n${url}`)}`,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="w-full bg-brand-black text-white rounded-lg py-2.5 text-[13px] font-bold"
              >
                {compartilhado ? "Obrigado por indicar!" : "Indicar para alguém"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push("/catalogo")}
              className="mt-3 text-[13px] text-brand-grey-light font-bold"
            >
              Ir para o catálogo →
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-[5px]">
                Profissional *
              </label>
              <select
                value={profId}
                onChange={(e) => setProfId(e.target.value)}
                className={`w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-brand-card outline-none ${
                  profId ? "text-brand-text" : "text-brand-grey-light"
                }`}
              >
                <option value="">Selecione o profissional...</option>
                {profs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              {preNome && (
                <div className="text-xs text-brand-grey-light mt-1">Pré-selecionado: {preNome}</div>
              )}
            </div>

            {/* Seleção de serviço — exibida apenas quando o profissional tem mais de um */}
            {precisaEscolherServico && (
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-[5px]">
                  Qual serviço você utilizou? *
                </label>
                <select
                  value={servicoId}
                  onChange={(e) => setServicoId(e.target.value)}
                  className={`w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-brand-card outline-none ${
                    servicoId ? "text-brand-text" : "text-brand-grey-light"
                  }`}
                >
                  <option value="">Selecione o serviço...</option>
                  {servicosDoProf.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.servico}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Toggle label="Foi pontual?" value={pontual} onChange={setPontual} />
            <Toggle label="Contrataria novamente?" value={novamente} onChange={setNovamente} />
            <Toggle label="Serviço conforme combinado?" value={conforme} onChange={setConforme} />

            <div className="mb-4">
              <div className="text-[13px] text-brand-grey mb-2">Nota geral *</div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNota(n)}
                    className={`flex-1 py-3 rounded-[6px] text-[20px] transition-all duration-150 border-[1.5px] ${
                      nota >= n
                        ? "bg-brand-red-light border-brand-red text-brand-red"
                        : "bg-brand-card border-brand-border text-brand-grey-light"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-brand-grey uppercase tracking-[0.8px] mb-[5px]">
                Comentário (opcional)
              </label>
              <textarea
                placeholder="Conte como foi a experiência..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                className="w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-brand-card outline-none resize-y"
              />
            </div>

            {status === "error" && (
              <p className="text-brand-red text-[13px] mb-3">Erro ao enviar. Tente novamente.</p>
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
              {submitting ? "Enviando..." : "Enviar Avaliação"}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
