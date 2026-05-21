"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, Sun } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "./notification-bell";
import { cn } from "@/lib/utils";

interface TopBarProps {
  sidebarCollapsed: boolean;
  onMenuToggle: () => void;
}

/**
 * Global top bar: hamburger, search, theme toggle, notifications, user.
 *
 * Search bar — mobile strategy
 * ────────────────────────────
 * Production PWAs (Twitter, YouTube) keep a single search input in the
 * shell rather than duplicating it per-page.  Visibility adapts to context:
 *
 *   • Desktop (≥ md):        full search bar, always visible.
 *   • Mobile, NOT on /search: a search icon button.  Tapping navigates to
 *                             /search where the user can type.
 *   • Mobile, ON /search:    the full search bar is revealed so the user
 *                             can type immediately, without a second widget
 *                             duplicated inside the page content.
 *
 * State management
 * ────────────────
 * `query` is driven exclusively by the user's keystrokes.  Because TopBar
 * lives in the persistent layout (it is never unmounted during navigation),
 * the state naturally survives route changes — the user can navigate away
 * and come back to /search without losing their typed query.
 *
 * The Server Component at app/(app)/search/page.tsx drives results via the
 * `?q=` URL search parameter, which is independent of this input state.
 * On a direct deep-link to /search?q=foo the page renders the correct
 * results server-side even if the input starts empty; users can re-type to
 * refine, which is consistent with native-app search conventions.
 *
 * Auto-focus
 * ──────────
 * When the user lands on /search (e.g. by tapping the search icon) the
 * input is focused programmatically via a DOM effect so the keyboard opens
 * immediately.  This effect only calls a DOM API (focus), not setState,
 * which is the intended pattern for effects per the React docs.
 */
export function TopBar({ sidebarCollapsed, onMenuToggle }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSearchPage = pathname === "/search";

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Auto-focus the search input when the user navigates to /search.
   * We focus only when the query is empty so we don't disrupt a user who
   * is returning to /search mid-edit (state preserved across navigation).
   * This effect mutates the DOM — not React state — which is the correct
   * use case for useEffect.
   */
  useEffect(() => {
    if (isSearchPage && query === "") {
      inputRef.current?.focus();
    }
    // `query` in deps: re-evaluate if the user clears the input and
    // navigates away and back, so focus is restored.
  }, [isSearchPage, query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else if (trimmed.length === 0 && isSearchPage) {
      // If the user clears the input and submits, go back to the empty
      // search page (removes the ?q= parameter so the hint is shown).
      router.replace("/search");
    }
  }

  function toggleTheme() {
    const isLight = document.documentElement.classList.toggle("light");
    // Persist the user's choice so the correct theme is applied on next load
    // without a flash.  The no-FOUC inline script in layout.tsx reads this
    // value synchronously before first paint.
    // try/catch: localStorage.setItem throws in iOS Safari private browsing.
    try {
      localStorage.setItem("propi-theme", isLight ? "light" : "dark");
    } catch {
      // Silently ignore — theme still works for the current session
    }
  }

  return (
    <header
      className={cn(
        // h-16/h-24 is the baseline height. When statusBarStyle is
        // "black-translucent", iOS extends the content under the status bar.
        // The paddingTop below pushes content inside the header below the
        // status bar area. env(safe-area-inset-top) is 0 on desktop and in
        // Safari browser; ~47-54px in iOS PWA standalone mode.
        "fixed right-0 top-0 z-20 flex min-h-16 md:min-h-24 items-center gap-4 border-b border-border px-4 md:px-8 bg-background/80 backdrop-blur-md",
        "transition-[left] duration-150 ease-out",
        sidebarCollapsed ? "md:left-16" : "md:left-[260px]",
        "left-0",
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Mobile hamburger — opens the mobile sidebar drawer */}
      <button
        onClick={onMenuToggle}
        className="text-muted-foreground hover:text-foreground md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/*
       * Search form
       *
       * Visibility classes:
       *   - "hidden md:flex"  →  only on desktop when NOT on /search
       *   - "flex"            →  always (desktop + mobile) when ON /search
       *
       * The `isSearchPage` condition removes the `hidden` breakpoint on
       * mobile so the bar is reachable without a duplicate input.
       */}
      <form
        onSubmit={handleSearch}
        className={cn(
          "relative flex-1 max-w-[320px]",
          isSearchPage ? "flex" : "hidden md:flex",
        )}
      >
        <Search
          className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar propiedades, contactos..."
          className="w-full rounded-full border border-border bg-muted py-2.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors shadow-inner"
        />
      </form>

      {/*
       * Mobile search icon — visible on every mobile page EXCEPT /search.
       * Tapping it navigates to /search where the full input is revealed.
       * Hidden on desktop (md:hidden) since the form above is always shown.
       */}
      {!isSearchPage && (
        <button
          onClick={() => router.push("/search")}
          className="md:hidden w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors bg-background"
          aria-label="Buscar"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
      )}

      {/* Spacer — pushes action icons to the right */}
      <div className="flex-1" />

      {/* Action icons */}
      <div className="flex items-center gap-3">
        {/* Theme toggle — switches between dark (default) and light modes */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors bg-background"
        >
          <Sun className="h-[18px] w-[18px]" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* User account menu */}
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
