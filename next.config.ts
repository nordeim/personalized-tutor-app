import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin file tracing to this project so the standalone server always lands
  // at .next/standalone/server.js — even when the repo is cloned inside a
  // parent workspace that has its own lockfile.
  outputFileTracingRoot: path.join(import.meta.dirname, "."),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Next 16's dev-origin protection silently blocks dev chunks served to
  // non-localhost origins (unhydrated page, native form GET fallbacks). The
  // clone is probed through localhost, 127.0.0.1, and the sandbox preview
  // host — allow them all.
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "preview-chat-613aea9a-ceae-4718-99fc-6319810895cb.space-z.ai",
  ],
};

export default nextConfig;
