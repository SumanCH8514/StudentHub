import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "rewrite-routine",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if ((req.url === "/routine" || req.url.startsWith("/routine/")) && !req.url.includes(".")) {
            req.url = "/routine/index.html";
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore"],
          "vendor-ai": ["@google/generative-ai", "@google/genai"],
          "vendor-ui": ["lucide-react", "react-markdown", "react-router-dom"],
        },
      },
      input: {
        main: path.resolve(__dirname, "index.html"),
        routine: path.resolve(__dirname, "routine/index.html"),
      },
    },
  },
});
