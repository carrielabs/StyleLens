import { readFileSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["tailwindcss"],
  outputFileTracingIncludes: {
    "/api/generate": ["node_modules/tailwindcss/lib/css/preflight.css"],
  },
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      config.plugins.push({
        apply(compiler: { hooks: { thisCompilation: { tap: (name: string, callback: (compilation: { emitAsset: (name: string, source: unknown) => void }) => void) => void } } }) {
          compiler.hooks.thisCompilation.tap("CopyTailwindPreflightCss", (compilation) => {
            const sourcePath = path.join(process.cwd(), "node_modules", "tailwindcss", "lib", "css", "preflight.css");
            const source = readFileSync(sourcePath, "utf8");
            compilation.emitAsset("chunks/css/preflight.css", new webpack.sources.RawSource(source));
          });
        },
      });
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
