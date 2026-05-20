import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

/**
 * App layout for all authenticated routes.
 * Provides sidebar, top bar, mobile navigation, toast notifications,
 * and PWA install prompt.
 *
 * Individual pages set their own `dynamic` export as needed.
 * The layout itself does not force dynamic rendering — this allows
 * Next.js to optimize static parts of the shell (sidebar, nav).
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      {/* Marker element: signals to the splash screen that React has mounted */}
      <div id="app-mounted" />
      <AppShell>{children}</AppShell>
      <PwaInstallPrompt />
    </ToastProvider>
  );
}
