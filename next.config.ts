import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.thum.io" },
    ],
  },
  // Remotion packages contain platform-specific native bindings (compositor for
  // darwin-arm64, esbuild, etc.) that can't be bundled by Turbopack/webpack —
  // mark them external so they're require()'d at runtime from node_modules.
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/compositor-darwin-arm64",
    "@remotion/compositor-darwin-x64",
    "@remotion/compositor-linux-arm64-gnu",
    "@remotion/compositor-linux-arm64-musl",
    "@remotion/compositor-linux-x64-gnu",
    "@remotion/compositor-linux-x64-musl",
    "@remotion/compositor-win32-x64-msvc",
    "esbuild",
  ],
};

export default nextConfig;
