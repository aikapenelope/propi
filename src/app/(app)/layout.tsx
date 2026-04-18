import { AppShell } from "@/components/layout/app-shell";

/**
 * App layout for all authenticated routes.
 * Provides sidebar, top bar, and mobile navigation.
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
  return <AppShell>{children}</AppShell>;
}
