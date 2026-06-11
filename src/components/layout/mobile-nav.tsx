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
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Glass background — use backdrop-blur-md (12px) only on desktop.
          On mobile the blur causes per-frame GPU compositing during scroll,
          especially in light mode where bg-background/90 is semi-transparent.
          Solid background on mobile eliminates the jank. */}
      <div className="absolute inset-0 bg-background md:bg-background/90 md:backdrop-blur-md border-t border-border/50" />

      <div className="relative flex items-center justify-around px-2 py-1.5">
        {/* Left items */}
        {navItems.slice(0, 2).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative"
            >
              {/* Active pill indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-xl" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 relative z-10 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={cn(
                  "text-[10px] relative z-10 transition-colors",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground/70",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Center FAB - More/Menu button */}
        <button
          onClick={onMorePress}
          className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Right items */}
        {navItems.slice(2, 4).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative"
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-xl" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 relative z-10 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={cn(
                  "text-[10px] relative z-10 transition-colors",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground/70",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
