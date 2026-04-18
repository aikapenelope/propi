"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  Users,
  Building2,
  Calendar,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ENABLE_META_INBOX } from "@/lib/feature-flags";

const navItems = ENABLE_META_INBOX
  ? [
      { href: "/marketing/inbox", label: "Inbox", icon: CheckSquare },
      { href: "/contacts", label: "Contactos", icon: Users },
      { href: "/properties", label: "Inmuebles", icon: Building2 },
      { href: "/calendar", label: "Agenda", icon: Calendar },
    ]
  : [
      { href: "/tasks", label: "Tareas", icon: CheckSquare },
      { href: "/contacts", label: "Contactos", icon: Users },
      { href: "/properties", label: "Inmuebles", icon: Building2 },
      { href: "/calendar", label: "Agenda", icon: Calendar },
    ];

interface MobileNavProps {
  onMorePress?: () => void;
}

export function MobileNav({ onMorePress }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/90 backdrop-blur-md md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {/* More button opens the mobile sidebar drawer */}
        <button
          onClick={onMorePress}
          className="flex flex-col items-center gap-0.5 px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span>Mas</span>
        </button>
      </div>
    </nav>
  );
}
