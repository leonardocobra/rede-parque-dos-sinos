// Assistente de Google Business Profile (GBP): a partir do cadastro na Rede,
// monta os campos prontos para o profissional colar no Google Meu Negócio.
// Lógica pura — sem I/O, testável com Vitest.
import { servicoPrimario, categoriaPrimaria, descricaoPerfil, CIDADE } from "./perfil";

// Deep link para criar/gerenciar o perfil no Google.
export const GBP_CREATE_URL = "https://business.google.com/create";

// Sugestão de categoria do GBP por categoria da Rede, usada como fallback
// quando o profissional não tem um serviço cadastrado (o serviço é mais
// específico e por isso preferido em categoriaGoogleSugerida).
const CATEGORIA_GOOGLE = {
  "Construção e Reforma": "Serviço de reformas",
  "Limpeza e Cuidados": "Serviço de limpeza",
  "Tecnologia e Digital": "Serviço de informática",
  "Ensino e Educação": "Professor particular",
  "Beleza e Moda": "Salão de beleza",
  Veículos: "Oficina mecânica",
  "Outros Serviços": "Prestador de serviços",
};

// Categoria sugerida para o GBP. Prefere o serviço principal (mais específico,
// ex. "Diarista"); cai para um rótulo por categoria; vazio sem dados.
export function categoriaGoogleSugerida(prof) {
  const servico = servicoPrimario(prof);
  if (servico) return servico;
  return CATEGORIA_GOOGLE[categoriaPrimaria(prof)] || "";
}

// Checklist de otimização do GBP (orientativo). A persistência de "já fiz"
// continua no ScoreMaturidade (colunas tem_google / tem_fotos_google).
export const CHECKLIST_GBP = [
  {
    id: "categoria",
    label: "Escolha a categoria certa",
    dica: "Use a categoria mais específica que descreve seu serviço — é o que o Google usa para te mostrar nas buscas locais.",
  },
  {
    id: "fotos",
    label: "Adicione pelo menos 3 fotos",
    dica: "Fotos reais de trabalhos concluídos. Perfis com fotos recebem muito mais pedidos de contato.",
  },
  {
    id: "horario",
    label: "Preencha o horário de atendimento",
    dica: "Informe os dias e horários em que você atende — evita que o cliente desista achando que está fechado.",
  },
  {
    id: "link",
    label: "Coloque o link do seu perfil na Rede no campo Site",
    dica: "Liga seu GBP ao seu perfil completo com avaliações e contato — e a Rede mede os clientes que vêm do Google.",
  },
];

// Monta os campos prontos para colar no GBP a partir do cadastro.
// `perfilUrl` é a URL (já com UTM) do perfil na Rede, usada no campo Site.
export function dadosGoogleNegocio(prof = {}, perfilUrl = "") {
  const areaAtendida =
    (prof.regioes || "").trim() ||
    (prof.bairro ? `${prof.bairro}, ${CIDADE}` : CIDADE);
  return {
    nome: prof.nome || "",
    categoria: categoriaGoogleSugerida(prof),
    areaAtendida,
    telefone: prof.telefone || "",
    descricao: descricaoPerfil(prof),
    site: perfilUrl,
  };
}
