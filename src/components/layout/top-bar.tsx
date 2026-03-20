"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
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

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background px-4 transition-all duration-200",
        sidebarCollapsed ? "md:left-16" : "md:left-64",
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

      {/* Global search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar contactos, propiedades..."
          className="h-9 w-full rounded-lg border border-border bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </form>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu (Clerk) */}
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-8 w-8",
          },
        }}
      />
    </header>
  );
}
