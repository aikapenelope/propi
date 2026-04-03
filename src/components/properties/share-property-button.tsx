"use client";

import { useState } from "react";
import {
  Share2,
  MessageCircle,
  Instagram,
  Facebook,
  Link2,
  Check,
  X,
} from "lucide-react";

interface SharePropertyButtonProps {
  title: string;
  price?: string;
  currency?: string;
  city?: string;
  propertyId: string;
}

export function SharePropertyButton({
  title,
  price,
  currency,
  city,
  propertyId,
}: SharePropertyButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${propertyId}`
      : `/p/${propertyId}`;

  const message = [
    title,
    price ? `Precio: ${new Intl.NumberFormat("es", { style: "currency", currency: currency || "USD", minimumFractionDigits: 0 }).format(parseFloat(price))}` : null,
    city ? `Ubicacion: ${city}` : null,
    "",
    publicUrl,
  ]
    .filter(Boolean)
    .join("\n");

  const encodedMessage = encodeURIComponent(message);

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const channels = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      color: "#25D366",
      href: `https://wa.me/?text=${encodedMessage}`,
    },
    {
      label: "Instagram",
      icon: Instagram,
      color: "#E1306C",
      href: `https://ig.me/m/?text=${encodedMessage}`,
    },
    {
      label: "Facebook",
      icon: Facebook,
      color: "#1877F2",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}&quote=${encodedMessage}`,
    },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Compartir
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-background p-3 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-foreground">
          Compartir propiedad
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {channels.map((ch) => (
          <a
            key={ch.label}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors hover:opacity-80"
            style={{ background: `${ch.color}12`, color: ch.color }}
          >
            <ch.icon className="h-4 w-4" />
            {ch.label}
          </a>
        ))}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Copiado
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              Copiar Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
