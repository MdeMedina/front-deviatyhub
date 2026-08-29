import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Salida self-contained para Docker (genera .next/standalone con server.js)
  output: "standalone",
  // Fija la raíz de tracing a esta app: sin esto, con varios lockfiles en el
  // árbol, Next infiere mal la raíz y anida server.js en subcarpetas.
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
