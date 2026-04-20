"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Menu, Sun } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "./notification-bell";
import { cn } from "@/lib/utils";

interface TopBarProps {
  sidebarCollapsed: boolean;
  onMenuToggle: () => void;
}

export function TopBar({ sidebarCollapsed, onMenuToggle }: TopBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function toggleTheme() {
    document.documentElement.classList.toggle("light");
  }

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-20 flex h-16 md:h-24 items-center gap-4 border-b border-border px-4 md:px-8 transition-all duration-200 bg-background/80 backdrop-blur-md",
        sidebarCollapsed ? "md:left-16" : "md:left-[260px]",
        "left-0",
      )}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="text-muted-foreground hover:text-foreground md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-[320px] hidden md:block">
        <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search properties, leads..."
          className="w-full rounded-full border border-border bg-muted py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors shadow-inner"
        />
      </form>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Action Icons */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all bg-background"
        >
          <Sun className="h-[18px] w-[18px]" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-10 w-10 border border-white/10",
            },
          }}
        />
      </div>
    </header>
  );
}
