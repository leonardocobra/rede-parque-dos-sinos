import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FeedbackButton from "./components/features/FeedbackButton";
import PageViewTracker from "./components/features/PageViewTracker";
import { BRAND } from "./brand";
import { siteUrl } from "../lib/site";
export const metadata = {
  // Base para resolver URLs relativas de OG image, canonical e twitter.
  metadataBase: new URL(siteUrl()),
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
        <PageViewTracker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
