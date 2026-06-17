import "./globals.css";
import FeedbackButton from "./components/FeedbackButton";
export const metadata = {
  title: "Rede de Profissionais – Parque dos Sinos",
  description: "Encontre profissionais confiáveis no Parque dos Sinos, Jacareí-SP.",
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
