"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Calendar, AlertTriangle, Cake, Mail, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/server/actions/notifications";
import { hapticLight } from "@/lib/haptics";

const typeIcons: Record<string, React.ReactNode> = {
  appointment_reminder: <Calendar className="h-4 w-4 text-blue-400" />,
  task_overdue: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  birthday: <Cake className="h-4 w-4 text-pink-400" />,
  campaign_complete: <Mail className="h-4 w-4 text-green-400" />,
  system: <Info className="h-4 w-4 text-muted-foreground" />,
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<Awaited<ReturnType<typeof getNotifications>>>([]);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and every 60s
  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const count = await getUnreadNotificationCount();
        if (mounted) setUnreadCount(count);
      } catch {
        // Silently fail if not authenticated
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (!open) return;

    async function fetchItems() {
      try {
        const data = await getNotifications();
        setItems(data);
      } catch {
        // Silently fail
      }
    }

    fetchItems();
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleToggle() {
    setOpen((prev) => !prev);
    hapticLight();
  }

  function handleClickNotification(id: string, link: string | null, read: boolean) {
    if (!read) {
      startTransition(async () => {
        await markNotificationRead(id);
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });
    }
    if (link) {
      setOpen(false);
      router.push(link);
    }
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all relative bg-background"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-h-[70vh] overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay notificaciones
                </p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n.id, n.link, n.read)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    !n.read && "bg-primary/5",
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {typeIcons[n.type] ?? typeIcons.system}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        !n.read ? "font-semibold text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
