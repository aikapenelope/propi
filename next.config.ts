import type { NextConfig } from "next";

// Validate environment variables at startup (see src/lib/env.ts).
// This import triggers the Zod validation when Next.js loads the config.
import "./src/lib/env";

const nextConfig: NextConfig = {
  output: "standalone",
  // Ensure sharp native binaries are included in the standalone output.
  // Required because the upload API route uses sharp for image processing.
  serverExternalPackages: ["sharp"],
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "10.0.1.20",
        port: "9000",
      },
      {
        // MercadoLibre listing thumbnails
        protocol: "https",
        hostname: "**.mlstatic.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.propi.aikalabs.cc https://*.clerk.accounts.dev https://challenges.cloudflare.com https://code.iconify.design https://cdn.tailwindcss.com https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://clerk.propi.aikalabs.cc https://*.clerk.accounts.dev https://*.clerk.com https://api.groq.com https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com",
              "frame-src 'self' https://clerk.propi.aikalabs.cc https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
