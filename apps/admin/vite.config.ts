import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";

const TLS_CERT = "/certs/tls/tls.crt";
const TLS_KEY = "/certs/tls/tls.key";

const https =
  fs.existsSync(TLS_CERT) && fs.existsSync(TLS_KEY)
    ? {
        cert: fs.readFileSync(TLS_CERT),
        key: fs.readFileSync(TLS_KEY),
      }
    : undefined;

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5000,
    https,
    proxy: {
      "/api": {
        target: "http://api:4000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
