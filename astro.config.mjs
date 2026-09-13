import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.hwpx.co.kr",
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file",
    inlineStylesheets: "always",
  },
});
