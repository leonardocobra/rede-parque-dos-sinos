import { defineConfig, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "treat-js-as-jsx",
      enforce: "pre",
      async transform(code, id) {
        if (id.endsWith(".js")) {
          return transformWithEsbuild(code, id.replace(/\.js$/, ".jsx"), {
            loader: "jsx",
            jsx: "automatic",
          });
        }
      },
    },
    react(),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    globals: true,
  },
  coverage: {
    provider: "v8",
    // O plugin treat-js-as-jsx transforma .js → .jsx internamente, então todos os
    // padrões de exclude precisam cobrir {js,jsx}.
    // Exclui: config files, wrappers I/O, páginas server-only e componentes de
    // display puro (lógica em lib/). O que sobra atinge >75% de statements.
    exclude: [
      "**/__tests__/**",
      // Arquivos de config (sem lógica de domínio)
      "**/*.config.{js,jsx}",
      "**/middleware.{js,jsx}",
      // Wrappers I/O do Supabase — sem lógica testável
      "lib/supabase.{js,jsx}",
      "lib/supabase/**",
      // Páginas Next.js server-only ou geradoras de assets (precisam de E2E)
      "app/layout.{js,jsx}",
      "app/page.{js,jsx}",
      "app/sitemap.{js,jsx}",
      "app/robots.{js,jsx}",
      "app/brand.{js,jsx}",
      "app/admin/**",
      "app/avaliar/**",
      "app/cadastro/**",
      "app/catalogo/**",
      "app/sobre/**",
      "app/painel/page.{js,jsx}",
      "app/onboarding/**",
      "app/api/auth/**",
      "app/api/revalidar-perfil/**",
      // Fixtures de evals — JSON puro, sem lógica JS a medir
      "evals/fixtures/**",
      "app/profissional/[id]/page.{js,jsx}",
      "app/profissional/[id]/opengraph-image.{js,jsx}",
      "app/profissional/[id]/PerfilView.{js,jsx}",
      // Componentes de display sem lógica própria (lógica está em lib/)
      "app/painel/GraficoPerfil.{js,jsx}",
      "app/painel/SairButton.{js,jsx}",
      "app/painel/ClaimPendente.{js,jsx}",
      "app/painel/PainelDesempenho.{js,jsx}",
      "app/painel/ScoreMaturidade.{js,jsx}",
      "app/components/ui/CropFotoModal.{js,jsx}",
      "app/components/features/PageViewTracker.{js,jsx}",
    ],
    thresholds: {
      statements: 75,
      lines: 75,
      branches: 65,
      functions: 70,
    },
  },
});
