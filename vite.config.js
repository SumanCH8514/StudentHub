import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // <--- Add this
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/svu/routine/",
  plugins: [
    react(), // <--- Add this BEFORE tailwindcss()
    tailwindcss(),
  ],
});
