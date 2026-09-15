import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hwpx.co.kr",
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file",
    inlineStylesheets: "always",
  },
});
