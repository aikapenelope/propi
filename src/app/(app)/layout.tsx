import { AppShell } from "@/components/layout/app-shell";

/**
 * App layout for all authenticated routes.
 * Provides sidebar, top bar, and mobile navigation.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
