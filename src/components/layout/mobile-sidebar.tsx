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
  Building2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mobile drawer opened by "Mas..." in bottom nav or hamburger in top bar.
 * Contains everything NOT in the bottom nav: Dashboard, Pipeline, Tasks, Docs, Search, Marketing.
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-background shadow-xl md:hidden">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">Propi</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {/* Quick access */}
          <div className="space-y-1">
            {quickItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Marketing section */}
          <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Marketing
          </p>
          <div className="space-y-1">
            {marketingItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
