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
          const rawUrl = req.url || "";
          const pathname = rawUrl.split("?")[0];
          const appRoutes = ["/privacy-policy", "/terms-of-service", "/about-us", "/about", "/admin"];
          const isAppRoute = appRoutes.some((r) => pathname === r || pathname.startsWith(r + "/") || pathname.startsWith(r));

          if ((pathname === "/routine" || pathname.startsWith("/routine/") || isAppRoute) && !pathname.includes(".")) {
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
