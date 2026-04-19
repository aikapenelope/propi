"use client";

import { useRouter } from "next/navigation";
import { Phone, Pencil } from "lucide-react";
import { SwipeAction } from "@/components/ui/swipe-action";
import type { SwipeActionItem } from "@/components/ui/swipe-action";

interface ContactSwipeRowProps {
  contactId: string;
  phone: string | null;
  children: React.ReactNode;
}

/**
 * Wraps a contact list row with swipe-to-reveal actions (mobile only).
 * Swipe left to reveal Call and Edit buttons.
 * On desktop, the swipe is invisible (no touch events).
 */
export function ContactSwipeRow({
  contactId,
  phone,
  children,
}: ContactSwipeRowProps) {
  const router = useRouter();

  const actions: SwipeActionItem[] = [];

  if (phone) {
    actions.push({
      icon: <Phone className="h-5 w-5" />,
      label: "Llamar",
      color: "#22c55e",
      onClick: () => {
        window.location.href = `tel:${phone}`;
      },
    });
  }

  actions.push({
    icon: <Pencil className="h-5 w-5" />,
    label: "Editar",
    color: "#3b82f6",
    onClick: () => {
      router.push(`/contacts/${contactId}/edit`);
    },
  });

  // On desktop (no touch), just render children without swipe wrapper
  if (actions.length === 0) {
    return <>{children}</>;
  }

  return <SwipeAction actions={actions}>{children}</SwipeAction>;
}
