"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Search,
  Sparkles,
  Kanban,
  CheckSquare,
  Instagram,
  Facebook,
  Mail,
  Zap,
  Video,
  Settings,
  X,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SharePortalButton } from "./share-portal-button";

/**
 * Mobile drawer opened by "Mas..." in bottom nav or hamburger in top bar.
 * Uses CSS transitions for smooth slide-in/out animation.
 * Width is capped at 80vw to prevent overflow on small screens.
 */

const quickItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/tasks", label: "Tareas", icon: CheckSquare },
  { href: "/market-analysis", label: "Propi Magic", icon: Sparkles },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/search", label: "Busqueda", icon: Search },
];

const marketingItems = [
  { href: "/marketing/instagram", label: "Instagram", icon: Instagram },
  { href: "/marketing/facebook", label: "Facebook", icon: Facebook },
  { href: "/marketing/tiktok", label: "TikTok", icon: Video },
  { href: "/marketing/email", label: "Email", icon: Mail },
  { href: "/marketing/drip", label: "Secuencias", icon: Zap },
  { href: "/marketing/settings", label: "Configuracion", icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  return (
    <>
      {/* Backdrop — always rendered, opacity controlled by open state */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — always rendered, position controlled by translate */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[80vw] max-w-[280px] flex-col bg-background border-r border-border shadow-2xl md:hidden transition-transform duration-200 ease-out will-change-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/logo-sidebar.png" alt="Propi" className="h-5 w-auto" />
            <span className="text-lg font-bold text-foreground">Propi</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {quickItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 mb-2 px-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Marketing
            </p>
          </div>
          <div className="space-y-0.5">
            {marketingItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-3 py-3 shrink-0" style={{ paddingBottom: "env(safe-area-inset-bottom, 0.75rem)" }}>
          <SharePortalButton />
          <Link
            href="/help"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-[18px] w-[18px] shrink-0" />
            <span>Ayuda</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
