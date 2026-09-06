// Reembed dos profissional_servicos — equivalente CLI de
// POST /api/admin/gerar-embeddings?forcar=true
//
// O endpoint exige sessão admin (Magic Link, instável). Este script usa a
// MESMA função `backfillEmbeddings`, então não há risco de drift de lógica.
//
//   npx vite-node scripts/reembed.mjs --dry     (só lista o que seria embeddado)
//   npx vite-node scripts/reembed.mjs --forcar  (reembeda TODOS)
//   npx vite-node scripts/reembed.mjs           (só os sem embedding)

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { backfillEmbeddings, textoParaEmbedding, contextoServico } from "../lib/ai/embeddings.js";

// .env.local não é carregado fora do Next — parse manual.
for (const linha of fs.readFileSync(path.resolve(".env.local"), "utf8").split("\n")) {
  const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^["']|["']$/g, "");
}

const dry = process.argv.includes("--dry");
const forcar = process.argv.includes("--forcar");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = dry
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente no .env.local");
if (!chave)
  throw new Error(
    dry
      ? "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente no .env.local"
      : "SUPABASE_SERVICE_ROLE_KEY ausente no .env.local (a escrita exige service_role)"
  );

const supabase = createClient(url, chave, { auth: { persistSession: false } });

if (dry) {
  const { data, error } = await supabase
    .from("profissional_servicos")
    .select("id, servico, descricao, embedding, profissional_id, profissionais(descricao)")
    .order("criado_em", { ascending: true });
  if (error) throw new Error(error.message);

  const totalPorProfissional = data.reduce((acc, s) => {
    acc[s.profissional_id] = (acc[s.profissional_id] ?? 0) + 1;
    return acc;
  }, {});

  console.log(
    `${data.length} serviços | ${data.filter((s) => s.embedding).length} com embedding\n`
  );
  for (const s of data) {
    const total = totalPorProfissional[s.profissional_id];
    const contexto = contextoServico({
      servico: s.servico,
      descricao: s.descricao,
      bio: s.profissionais?.descricao,
      totalServicos: total,
    });
    const texto = textoParaEmbedding(s.servico, contexto);
    console.log(
      `[${s.embedding ? "ok " : "NULL"}] (${total} serv.) ${texto.slice(0, 100)}${texto.length > 100 ? "…" : ""}`
    );
  }
  console.log("\n(dry-run — nada foi gravado)");
} else {
  console.log(`Reembed ${forcar ? "FORÇADO (todos)" : "só dos sem embedding"}…`);
  const resultado = await backfillEmbeddings(supabase, { forcar });
  console.log(resultado);
}
