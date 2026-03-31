import { AppShell } from "@/components/layout/app-shell";

/**
 * App layout for all authenticated routes.
 * Provides sidebar, top bar, and mobile navigation.
 *
 * force-dynamic: these pages require DB + auth at runtime,
 * never pre-render them during build.
 */
export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
