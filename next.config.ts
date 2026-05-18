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
              // unsafe-inline: required by Clerk (runtime CSS-in-JS) and landing page Iconify loader.
              // unsafe-eval: only needed in development for React error stack reconstruction.
              // In production, neither React nor Next.js use eval().
              // Reference: https://nextjs.org/docs/app/guides/content-security-policy
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://clerk.propi.aikalabs.cc https://*.clerk.accounts.dev https://challenges.cloudflare.com https://code.iconify.design`,
              // unsafe-inline: required by Clerk for runtime CSS-in-JS styling.
              // Reference: https://clerk.com/docs/guides/secure/best-practices/csp-headers
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Restrict img-src to known domains instead of blanket https:/http:.
              // Covers: MinIO proxy (self), inline SVGs (data:), uploads (blob:),
              // landing page assets (supabase), ML thumbnails (mlstatic), Clerk avatars.
              "img-src 'self' data: blob: https://*.supabase.co https://*.mlstatic.com https://img.clerk.com",
              "connect-src 'self' https://clerk.propi.aikalabs.cc https://*.clerk.accounts.dev https://*.clerk.com https://api.groq.com https://api.iconify.design https://api.simplesvg.com https://api.unisvg.com",
              "frame-src 'self' https://clerk.propi.aikalabs.cc https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
              "worker-src 'self' blob:",
              // Prevent form submissions to external domains (phishing protection).
              "form-action 'self'",
              // Prevent <base> tag injection that could redirect relative URLs.
              "base-uri 'self'",
              // Block <object>, <embed>, <applet> — legacy plugin vectors.
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
