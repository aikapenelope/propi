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

      {/* Main content area */}
      <main
        className={cn(
          "min-h-screen pt-14 pb-16 transition-all duration-200 md:pb-0",
          sidebarCollapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </>
  );
}
