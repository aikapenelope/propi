"use client";

import { useRouter } from "next/navigation";
import { Pencil, Share2 } from "lucide-react";
import { SwipeAction } from "@/components/ui/swipe-action";
import type { SwipeActionItem } from "@/components/ui/swipe-action";

interface PropertySwipeCardProps {
  propertyId: string;
  title: string;
  children: React.ReactNode;
}

/**
 * Wraps a property card with swipe-to-reveal actions (mobile only).
 * Swipe left to reveal Share and Edit buttons.
 */
export function PropertySwipeCard({
  propertyId,
  title,
  children,
}: PropertySwipeCardProps) {
  const router = useRouter();

  const actions: SwipeActionItem[] = [
    {
      icon: <Share2 className="h-5 w-5" />,
      label: "Compartir",
      color: "#8b5cf6",
      onClick: () => {
        const url = `${window.location.origin}/p/${propertyId}`;
        if (navigator.share) {
          navigator.share({ title, url }).catch(() => {});
        } else {
          navigator.clipboard.writeText(url);
        }
      },
    },
    {
      icon: <Pencil className="h-5 w-5" />,
      label: "Editar",
      color: "#3b82f6",
      onClick: () => {
        router.push(`/properties/${propertyId}/edit`);
      },
    },
  ];

  return <SwipeAction actions={actions}>{children}</SwipeAction>;
}
