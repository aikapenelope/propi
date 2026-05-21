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
    /**
     * "black-translucent" makes the iOS status bar transparent, letting the
     * app background (#090A0F) show through instead of an opaque system bar.
     * This gives the PWA a full-screen, immersive feel.
     *
     * Required companion: the TopBar header must add
     * `padding-top: env(safe-area-inset-top)` so interactive controls are
     * not obscured by the status bar clock/battery indicators.
     * The main content must offset by the same amount via `.pt-topbar`.
     */
    statusBarStyle: "black-translucent",
    title: "Propi",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A2B1D",
  width: "device-width",
  initialScale: 1,
  /**
   * maximumScale and userScalable intentionally removed.
   *
   * These were previously set to prevent iOS Safari from auto-zooming on
   * <input> focus (a known bug when font-size < 16px).  Sprint 3 fixed that
   * root cause by setting font-size ≥ 16px on all inputs via `.input-base`,
   * so blocking zoom is no longer needed.
   *
   * Removing the restriction restores WCAG 2.1 SC 1.4.4 compliance (text
   * must be resizable to 200% without loss of content or functionality).
   */
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
          {/*
           * Inline script 1 — Theme persistence (no-FOUC)
           *
           * Reads the saved theme from localStorage and applies the 'light'
           * class to <html> BEFORE the first paint.  Without this, users who
           * switch to light mode see a flash of the dark theme on every page
           * load while JavaScript hydrates.
           *
           * Must execute synchronously in <head>/<body> before any content
           * is rendered.  The try/catch handles cases where localStorage is
           * unavailable (iOS Safari private browsing, storage quota exceeded).
           */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{if(localStorage.getItem('propi-theme')==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`,
            }}
          />

          {/* Inline splash screen — only visible in PWA standalone mode.
              In a normal browser tab (landing page, public links), the splash
              is hidden via CSS media query. Only shows when opened from home screen. */}
          <div
            id="splash"
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              display: "none",
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
                  /* Only show splash in PWA standalone mode (opened from home screen) */
                  @media (display-mode: standalone) {
                    #splash { display: flex !important; }
                  }
                `,
              }}
            />
          </div>
          {/* Inline script 2 — hides splash once React hydrates (PWA only). */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(){
                  function hideSplash(){
                    var s=document.getElementById('splash');
                    if(s){s.style.opacity='0';s.style.pointerEvents='none';}
                  }
                  if(document.readyState==='loading'){
                    document.addEventListener('DOMContentLoaded',hideSplash);
                  }else{
                    hideSplash();
                  }
                })();
              `,
            }}
          />
          <ServiceWorkerRegister />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
