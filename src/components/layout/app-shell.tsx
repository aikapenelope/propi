"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileNav } from "./mobile-nav";
import { MobileSidebar } from "./mobile-sidebar";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { cn } from "@/lib/utils";

/**
 * Root shell for all authenticated app pages.
 *
 * Manages two pieces of UI state:
 *   - sidebarCollapsed: desktop sidebar width (expanded / collapsed).
 *   - mobileMenuOpen: mobile drawer (open / closed).
 *
 * Callback stability
 * ──────────────────
 * `handleMobileClose` is wrapped in `useCallback` so that child components
 * that accept it as a prop (MobileSidebar, MobileNav) receive a stable
 * reference across renders.  Without this, every re-render of AppShell
 * would produce a new function reference, causing:
 *   - MobileSidebar's useEffect deps to see a "new" onClose on every render
 *     → the effect re-runs unnecessarily, repeatedly toggling event listeners
 *     and the body overflow lock.
 *   - Potential missed cleanups on fast re-render sequences.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Stable reference — see JSDoc above
  const handleMobileClose = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <>
      {/* Desktop sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Mobile sidebar overlay */}
      <MobileSidebar
        open={mobileMenuOpen}
        onClose={handleMobileClose}
      />

      {/* Top bar */}
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onMenuToggle={() => setMobileMenuOpen(true)}
      />

      {/* Main content area - fixed structure, no layout shift */}
      <main
        className={cn(
          "min-h-screen pt-16 md:pt-24 pb-20 md:pb-0 relative overflow-x-hidden",
          "transition-[padding-left] duration-150 ease-out",
          sidebarCollapsed ? "md:pl-16" : "md:pl-[260px]",
        )}
      >
        {/* Ambient background effects (desktop only) */}
        {/* Dark mode: green + purple glows */}
        <div className="absolute top-0 right-[20%] w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0 hidden md:block ambient-dark" />
        <div className="absolute bottom-0 left-[10%] w-[400px] h-[400px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none z-0 hidden md:block ambient-dark" />
        {/* Light mode: warm orange/amber glows covering more area */}
        <div className="absolute top-[-10%] right-[-5%] w-[900px] h-[600px] rounded-full pointer-events-none z-0 hidden md:block ambient-light" style={{ background: "radial-gradient(ellipse, rgba(251, 146, 60, 0.18) 0%, rgba(251, 146, 60, 0.06) 50%, transparent 75%)" }} />
        <div className="absolute bottom-[-5%] left-[-10%] w-[800px] h-[700px] rounded-full pointer-events-none z-0 hidden md:block ambient-light" style={{ background: "radial-gradient(ellipse, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.04) 50%, transparent 75%)" }} />
        <div className="absolute top-[30%] left-[40%] w-[600px] h-[600px] rounded-full pointer-events-none z-0 hidden md:block ambient-light" style={{ background: "radial-gradient(ellipse, rgba(234, 88, 12, 0.10) 0%, transparent 65%)" }} />
        <div className="relative z-10 min-w-0">
          <PullToRefresh>{children}</PullToRefresh>
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav onMorePress={() => setMobileMenuOpen(true)} />
    </>
  );
}
