"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileNav } from "./mobile-nav";
import { MobileSidebar } from "./mobile-sidebar";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Top bar */}
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onMenuToggle={() => setMobileMenuOpen(true)}
      />

      {/* Main content area - fixed structure, no layout shift */}
      <main
        className={cn(
          "min-h-screen pt-16 md:pt-24 pb-20 md:pb-0 transition-all duration-200 relative overflow-x-hidden",
          sidebarCollapsed ? "md:pl-16" : "md:pl-[260px]",
        )}
      >
        {/* Ambient background effects (desktop only) */}
        <div className="absolute top-0 right-[20%] w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0 hidden md:block" />
        <div className="absolute bottom-0 left-[10%] w-[400px] h-[400px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none z-0 hidden md:block" />
        <div className="relative z-10 min-w-0">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav onMorePress={() => setMobileMenuOpen(true)} />
    </>
  );
}
