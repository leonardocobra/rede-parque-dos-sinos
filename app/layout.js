import "./globals.css";
import FeedbackButton from "./components/FeedbackButton";
export const metadata = {
  title: "Rede de Profissionais – Parque dos Sinos",
  description: "Encontre profissionais confiáveis no Parque dos Sinos, Jacareí-SP.",
};
export default function RootLayout({ children }) {
  return <html lang="pt-BR"><body>{children}<FeedbackButton /></body></html>;
}
