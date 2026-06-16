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
