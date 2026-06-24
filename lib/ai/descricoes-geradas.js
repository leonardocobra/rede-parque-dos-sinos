// Descrições de serviço geradas por LLM e revisadas por humano.
//
// Contexto: a busca semântica depende de texto descritivo rico no embedding.
// A fonte preferida é a descrição do serviço; na falta dela, a bio do
// profissional (profissional_servicos.descricao -> profissionais.descricao).
// Para serviços que não têm nenhuma das duas, o nome cru ("SP", "Unhas em
// gel/manicure") gera embeddings pobres.
//
// Em vez de gerar texto em tempo de execução (não-determinístico, sem
// revisão), mantemos aqui as descrições geradas e APROVADAS manualmente.
// Cada entrada é chaveada pelo nome exato do serviço como está no banco.
// Workflow: gerarDescricaoServico() rascunha -> humano revisa -> entra aqui
// -> backfill reembeda. Isso preserva o "preview antes de aplicar".

export const DESCRICOES_GERADAS = {
  "Unhas em gel/manicure":
    "Manicure e alongamento de unhas em gel. Aplicação, manutenção, esmaltação e decoração de unhas; cuidados com mãos e pés. Atende quem busca fazer as unhas, alongamento e nail art.",
  "Vendas Natura, Boticário, Eudora e presentes":
    "Revenda de cosméticos e perfumaria das marcas Natura, O Boticário e Eudora. Venda de perfumes, maquiagem, produtos de beleza e presentes para todas as ocasiões.",
};

// Retorna a descrição gerada/aprovada para um serviço, ou null se não houver.
export function descricaoGerada(servico) {
  return DESCRICOES_GERADAS[servico?.trim()] ?? null;
}
