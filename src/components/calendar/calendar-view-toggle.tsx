"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, List } from "lucide-react";

interface CalendarViewToggleProps {
  current: "calendar" | "agenda";
}

export function CalendarViewToggle({ current }: CalendarViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchView(view: "calendar" | "agenda") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "calendar") {
      params.delete("view");
    } else {
      params.set("view", "agenda");
    }
    router.push(`/calendar?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1 max-w-xs">
      <button
        onClick={() => switchView("calendar")}
        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          current === "calendar"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Calendar className="h-3.5 w-3.5" />
        Calendario
      </button>
      <button
        onClick={() => switchView("agenda")}
        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
          current === "agenda"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <List className="h-3.5 w-3.5" />
        Agenda
      </button>
    </div>
  );
}
