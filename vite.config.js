import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base must match the GitHub Pages repo path for project-pages deploys
export default defineConfig({
  plugins: [react()],
  base: "/gratitude-challenge-surveys-dashboard/",
});
