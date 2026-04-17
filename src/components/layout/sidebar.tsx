"use client";

import Link from "next/link";
import { ENABLE_META_INBOX } from "@/lib/feature-flags";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Calendar,
  FileText,
  CheckSquare,
  Instagram,
  Facebook,
  MessageCircle,
  Mail,
  Video,
  Zap,
  Settings,
  ChevronRight,
  Sparkles,
  BarChart3,
  History,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { UnreadBadge } from "./unread-badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contactos", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/properties", label: "Propiedades", icon: Building2 },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/tasks", label: "Tareas", icon: CheckSquare },
  { href: "/documents", label: "Documentos", icon: FileText },
];

const intelligenceItems = [
  { href: "/market-analysis", label: "Propi Magic", icon: Sparkles, exact: true },
  { href: "/market-analysis/kpis", label: "KPIs Mercado", icon: BarChart3, exact: true },
  { href: "/market-analysis/searches", label: "Busquedas", icon: History, exact: true },
];

const allMarketingItems = [
  { href: "/marketing/inbox", label: "Inbox", icon: MessageCircle, metaOnly: true },
  { href: "/marketing/instagram", label: "Instagram", icon: Instagram },
  { href: "/marketing/facebook", label: "Facebook", icon: Facebook },
  { href: "/marketing/tiktok", label: "TikTok", icon: Video },
  { href: "/marketing/email", label: "Email", icon: Mail },
  { href: "/marketing/drip", label: "Secuencias", icon: Zap },
  { href: "/marketing/settings", label: "Configuracion", icon: Settings },
];

const marketingItems = ENABLE_META_INBOX
  ? allMarketingItems
  : allMarketingItems.filter((item) => !item.metaOnly);

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function NavLink({ href, label, icon: Icon, collapsed, pathname }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; collapsed: boolean; pathname: string }) {
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
        isActive
          ? "bg-primary text-primary-foreground font-bold shadow-[0_4px_20px_rgba(0,255,85,0.15)]"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SmallNavLink({ href, label, icon: Icon, collapsed, pathname, badge, exact }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; collapsed: boolean; pathname: string; badge?: React.ReactNode; exact?: boolean }) {
  const isActive = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-primary text-primary-foreground font-bold shadow-[0_4px_20px_rgba(0,255,85,0.15)]"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span>{label}</span>}
      {!collapsed && badge}
    </Link>
  );
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-border transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-[260px]",
      )}
      style={{ background: "var(--sidebar-bg)" }}
    >
      {/* Subtle gradient glow */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="h-24 flex items-center px-8 relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          {/* Soundwave icon */}
          <div className="flex gap-[2px] items-center h-6">
            <div className="w-[3px] h-3 bg-foreground rounded-full opacity-60" />
            <div className="w-[3px] h-5 bg-foreground rounded-full opacity-80" />
            <div className="w-[3px] h-6 bg-foreground rounded-full shadow-[0_0_10px_currentColor]" />
            <div className="w-[3px] h-4 bg-foreground rounded-full opacity-80" />
            <div className="w-[3px] h-2 bg-foreground rounded-full opacity-60" />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold tracking-wide text-foreground">
              Propi
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 relative z-10">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} collapsed={collapsed} pathname={pathname} />
        ))}

        {/* Intelligence section */}
        {!collapsed && (
          <div className="mt-6 mb-2 px-4">
            <div className="text-[11px] font-bold text-muted-foreground/50 tracking-widest uppercase">
              Propi Magic <span className="mx-1 opacity-30">/</span> Marketing
            </div>
          </div>
        )}
        {collapsed && <hr className="my-3 border-border" />}

        {intelligenceItems.map((item) => (
          <SmallNavLink key={item.href} {...item} collapsed={collapsed} pathname={pathname} />
        ))}

        {marketingItems.map((item) => (
          <SmallNavLink
            key={item.href}
            {...item}
            collapsed={collapsed}
            pathname={pathname}
            badge={ENABLE_META_INBOX && item.href === "/marketing/inbox" ? <UnreadBadge /> : undefined}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 flex flex-col gap-1 border-t border-border relative z-10">
        <SmallNavLink href="/help" label="Help Center" icon={HelpCircle} collapsed={collapsed} pathname={pathname} />
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <AlertTriangle className="h-5 w-5" />
              <span>Report</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
