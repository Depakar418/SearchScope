import type { NextConfig } from "next";
import path from "node:path";

const vercel = process.env.VERCEL === "1" || process.env.SEARCHSCOPE_TARGET === "vercel";
const nextConfig: NextConfig = vercel ? {
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "./platform": path.resolve(process.cwd(), "db/vercel-workers.ts"),
    };
    return config;
  },
} : {};

export default nextConfig;
