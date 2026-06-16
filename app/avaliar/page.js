"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { supabase } from "../../lib/supabase";

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
                  ? "bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]"
                  : "bg-[#FFEBEE] text-brand-red border-[#EF9A9A]"
                : "bg-white text-brand-grey border-brand-border"
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
  const [pontual, setPontual] = useState(null);
  const [novamente, setNovamente] = useState(null);
  const [conforme, setConforme] = useState(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("profissionais")
      .select("id, nome, servico")
      .order("nome")
      .then(({ data }) => setProfs(data || []));
  }, []);

  const valid = profId && pontual !== null && novamente !== null && conforme !== null;

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from("avaliacoes").insert({
      profissional_id: profId,
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
    setTimeout(() => router.push("/catalogo"), 2000);
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
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-full bg-brand-red-light flex items-center justify-center mx-auto mb-4 text-[28px]">
              ✓
            </div>
            <h3 className="font-display text-[22px]">Avaliação Enviada!</h3>
            <p className="text-[13px] text-brand-grey mt-2">
              Obrigado por contribuir com a comunidade.
            </p>
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
                className={`w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-white outline-none ${
                  profId ? "text-brand-black" : "text-brand-grey-light"
                }`}
              >
                <option value="">Selecione o profissional...</option>
                {profs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} – {p.servico}
                  </option>
                ))}
              </select>
              {preNome && (
                <div className="text-xs text-brand-grey-light mt-1">Pré-selecionado: {preNome}</div>
              )}
            </div>

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
                      nota >= n ? "bg-[#FFF8E1] border-[#FFD54F]" : "bg-white border-brand-border"
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
                className="w-full py-[11px] px-[14px] rounded-lg border-[1.5px] border-brand-border text-sm bg-white outline-none resize-y"
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
