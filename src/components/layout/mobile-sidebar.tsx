"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  CheckSquare,
  Instagram,
  Facebook,
  Video,
  Settings,
  X,
  HelpCircle,
  Handshake,
  Scale,
  BarChart3,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SharePortalButton } from "./share-portal-button";

/**
 * Mobile drawer opened by the hamburger in TopBar or the FAB in MobileNav.
 * Slides in from the left with a backdrop overlay.
 *
 * Effect design — two separated concerns
 * ───────────────────────────────────────
 * 1. Keyboard / overflow effect
 *    Manages the Escape key listener and the `body.overflow: hidden` scroll
 *    lock.  Depends only on `open` and `onClose`, so it re-runs only when
 *    the drawer opens or closes — not on every pathname change.
 *
 * 2. Pathname auto-close effect
 *    Closes the drawer whenever the active route changes.  This catches
 *    navigation that does NOT go through a link's onClick handler:
 *    browser back/forward, programmatic router.push(), or deep links.
 *    Without this, the drawer can remain open with body.overflow: hidden
 *    active, making the next page non-scrollable ("trabado").
 *
 *    The `open` guard inside the effect (not in deps) is intentional: we
 *    want the effect to fire exclusively on pathname changes, not every time
 *    `open` toggles.  The eslint-disable comment below suppresses the
 *    exhaustive-deps warning for this deliberate omission.
 *
 * `onClose` stability
 * ────────────────────
 * The caller (AppShell) passes `onClose` as a `useCallback`-stabilised
 * reference, so including it in the keyboard effect's deps is safe — it
 * will never cause an unnecessary re-run in practice.
 */

const quickItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tareas", icon: CheckSquare },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/matches", label: "Matches", icon: Handshake },
];

const intelligenceItems = [
  { href: "/valuation", label: "Tasacion", icon: Scale },
  { href: "/market-analysis", label: "Propi Magic", icon: Sparkles },
  { href: "/market-analysis/kpis", label: "KPIs Mercado", icon: BarChart3 },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/commissions", label: "Comisiones", icon: Calculator },
];

const marketingItems = [
  { href: "/marketing/instagram", label: "Instagram", icon: Instagram },
  { href: "/marketing/facebook", label: "Facebook", icon: Facebook },
  { href: "/marketing/tiktok", label: "TikTok", icon: Video },
  { href: "/marketing/settings", label: "Configuracion", icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  // ── Effect 1: Escape key + body scroll lock ──────────────────────────────
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Reset overflow in cleanup: runs when `open` goes false OR on unmount,
      // preventing a stuck scroll lock in either case.
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // ── Effect 2: Auto-close on navigation ───────────────────────────────────
  // Intentionally depends only on `pathname`.  `open` and `onClose` are read
  // inside the body but omitted from deps — adding them would make the effect
  // fire on every open/close toggle, not just on route changes.
  useEffect(() => {
    if (open) onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <nav className="flex-1 overflow-y-auto px-3 py-3 overscroll-contain">
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
              Inteligencia
            </p>
          </div>
          <div className="space-y-0.5">
            {intelligenceItems.map((item) => {
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
