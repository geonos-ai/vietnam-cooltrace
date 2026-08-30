import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function githubPagesBase() {
  const explicitBase = process.env.VITE_BASE_PATH;
  if (explicitBase) {
    return explicitBase.endsWith("/") ? explicitBase : `${explicitBase}/`;
  }

  if (process.env.GITHUB_ACTIONS === "true") {
    const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
    if (repositoryName) return `/${repositoryName}/`;
  }

  return "/";
}

export default defineConfig({
  base: githubPagesBase(),
  plugins: [react()],
});
