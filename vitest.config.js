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
});
