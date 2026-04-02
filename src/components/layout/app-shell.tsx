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

      {/* Mobile sidebar overlay (opened by top bar menu OR bottom nav "Mas") */}
      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Top bar */}
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onMenuToggle={() => setMobileMenuOpen(true)}
      />

      {/* Main content area */}
      <main
        className={cn(
          "min-h-screen pt-24 pb-16 transition-all duration-200 md:pb-0 relative",
          sidebarCollapsed ? "md:pl-16" : "md:pl-[260px]",
        )}
      >
        {/* Ambient background effects */}
        <div className="absolute top-0 right-[20%] w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-0 left-[10%] w-[400px] h-[400px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none z-0" />
        <div className="relative z-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav onMorePress={() => setMobileMenuOpen(true)} />
    </>
  );
}
