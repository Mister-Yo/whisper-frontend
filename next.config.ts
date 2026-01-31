import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@hot-labs/kit",
    "@hot-labs/near-connect",
    "@hot-labs/omni-sdk",
  ],

  turbopack: {},

  webpack: (config, { isServer }) => {
    // Force @hot-labs/kit to be treated as ESM (it uses import/export but package.json says commonjs)
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/@hot-labs/,
      type: "javascript/auto",
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  reactStrictMode: true,
};

export default nextConfig;
