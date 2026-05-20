import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Propi - CRM Inmobiliario",
  description: "CRM moderno para agentes y agencias inmobiliarias",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Propi",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A2B1D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} antialiased`}
        >
          {/* Inline splash screen — visible instantly before React hydrates.
              Pure CSS animation, no JS dependency. Hidden once React mounts
              via the #__next sibling rendering (splash uses :has() to auto-hide).
              Fallback: hidden after 4s via animation in case :has() isn't supported. */}
          <div
            id="splash"
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#090A0F",
              transition: "opacity 0.3s ease",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              width={64}
              height={64}
              style={{
                borderRadius: "16px",
                animation: "splash-pulse 1.5s ease-in-out infinite",
              }}
            />
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  @keyframes splash-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.95); }
                  }
                  /* Auto-hide splash when React content renders */
                  body:has(#app-mounted) #splash {
                    opacity: 0;
                    pointer-events: none;
                  }
                  /* Fallback: force-hide after 4s for browsers without :has() */
                  @keyframes splash-timeout {
                    0%, 99% { opacity: 1; }
                    100% { opacity: 0; pointer-events: none; }
                  }
                  @supports not selector(:has(*)) {
                    #splash { animation: splash-timeout 4s forwards; }
                  }
                `,
              }}
            />
          </div>
          <ServiceWorkerRegister />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
