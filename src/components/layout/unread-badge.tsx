"use client";

import { useEffect, useState } from "react";
import { getTotalUnreadCount } from "@/server/actions/messaging";

/**
 * Badge showing total unread message count.
 * Polls every 30 seconds for new messages.
 */
export function UnreadBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetch() {
      try {
        const n = await getTotalUnreadCount();
        if (mounted) setCount(n);
      } catch {
        // Ignore errors (not authenticated, etc.)
      }
    }

    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
