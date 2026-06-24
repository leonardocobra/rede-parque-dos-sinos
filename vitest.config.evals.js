import { defineConfig } from "vite";

// Config dedicado para os evals LLM-as-judge.
// Usa Node puro — sem jsdom, sem plugin react/jsx — porque evals não renderizam
// componentes React e o SDK Anthropic recusa instanciação em ambientes browser-like.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["evals/__tests__/**/*.{js,ts}"],
  },
});
