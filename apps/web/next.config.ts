import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@polza/db", "@polza/shared"],
  devIndicators: false,
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    };
    return config;
  },
};

export default nextConfig;
