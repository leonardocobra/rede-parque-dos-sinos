export const CATS = [
  { value: "Construção e Reforma", icon: "🏗️", ex: "Pedreiro, Eletricista, Encanador, Pintor" },
  { value: "Limpeza e Cuidados", icon: "🧹", ex: "Diarista, Faxineira, Cuidador de Idosos" },
  {
    value: "Tecnologia e Digital",
    icon: "💻",
    ex: "Técnico de Informática, Social Media, Designer",
  },
  { value: "Ensino e Educação", icon: "📚", ex: "Professor Particular, Reforço Escolar" },
  { value: "Beleza e Moda", icon: "✂️", ex: "Costureira, Manicure, Cabeleireiro" },
  { value: "Veículos", icon: "🔧", ex: "Mecânico, Funileiro, Eletricista Automotivo" },
  { value: "Outros Serviços", icon: "⚡", ex: "Jardineiro, Fotógrafo, Pequenos Empreendedores" },
];
export function catIcon(name) {
  return (CATS.find((c) => c.value === name) || {}).icon || "⚡";
}

// Regras básicas da rede — compartilhadas entre a home e a página "Sobre".
export const REGRAS = [
  "Divulgação gratuita.",
  "Respeito entre todos os participantes.",
  "Não são permitidos conteúdos ilegais.",
  "A contratação é de responsabilidade das partes.",
  "O grupo apenas facilita o contato.",
  "Avaliações devem ser respeitosas e baseadas em experiências reais.",
];
