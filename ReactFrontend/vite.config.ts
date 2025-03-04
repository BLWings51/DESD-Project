import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",  // 👈 Ensures assets load correctly
  server: {
    port: 5173,
  },
});


