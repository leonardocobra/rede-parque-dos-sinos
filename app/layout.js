import "./globals.css";
import FeedbackButton from "./components/FeedbackButton";
import { BRAND } from "./brand";
export const metadata = {
  title: `${BRAND.nome} – Profissionais de confiança em Jacareí`,
  description:
    "Encontre profissionais de confiança indicados por vizinhos. A Rede começou no Parque dos Sinos, Jacareí-SP, e cresce pela comunidade.",
};
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
