"use client";

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

/**
 * Mobile drawer opened by "Mas..." in bottom nav or hamburger in top bar.
 * Slides in from the left with animation. Includes safe area padding.
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

  // Always render when open so CSS transitions work.
  // The translate-x transition handles the slide animation.
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-background border-r border-border shadow-2xl md:hidden transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-[2px] items-center h-5">
              <div className="w-[2px] h-2 bg-foreground rounded-full opacity-60" />
              <div className="w-[2px] h-3.5 bg-foreground rounded-full opacity-80" />
              <div className="w-[2px] h-5 bg-foreground rounded-full" />
              <div className="w-[2px] h-3 bg-foreground rounded-full opacity-80" />
              <div className="w-[2px] h-1.5 bg-foreground rounded-full opacity-60" />
            </div>
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
          {/* Quick access */}
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

          {/* Marketing section */}
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
        <div className="border-t border-border px-3 py-3" style={{ paddingBottom: "env(safe-area-inset-bottom, 0.75rem)" }}>
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
