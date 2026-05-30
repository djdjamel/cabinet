import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pino utilise worker_threads et fs natif — ne pas bundler avec webpack
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default nextConfig;
