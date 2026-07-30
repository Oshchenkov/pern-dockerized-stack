import type { NextConfig } from "next";
import fs from "node:fs";

const TLS_CERT = "/certs/tls/tls.crt";
const TLS_KEY = "/certs/tls/tls.key";

const hasCerts = fs.existsSync(TLS_CERT) && fs.existsSync(TLS_KEY);

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://api:4000/:path*",
      },
    ];
  },
  experimental: hasCerts
    ? {
        serverComponentsExternalPackages: [],
      }
    : {},
};

export default nextConfig;
