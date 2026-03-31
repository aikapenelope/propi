import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "10.0.1.20",
        port: "9000",
      },
    ],
  },
};

export default nextConfig;
