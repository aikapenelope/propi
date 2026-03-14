import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Enable standalone output for Docker/Coolify deployment
  output: "standalone",
  images: {
    // MinIO serves images from the data plane
    remotePatterns: [
      {
        protocol: "http",
        hostname: "10.0.1.20",
        port: "9000",
      },
    ],
  },
};

export default withSerwist(nextConfig);
