"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ListingCards } from "./listing-card";
import { KPIBar } from "./kpi-bar";
import { updateSearchMessages } from "@/server/actions/magic-searches";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  listings?: MarketListingData[];
  kpis?: KPIData;
  searchId?: string;
}

interface MarketListingData {
  id: string;
  externalId: string;
  title: string | null;
  price: string | null;
  currency: string | null;
  areaM2: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  propertyType: string | null;
  neighborhood: string | null;
  city: string | null;
  permalink: string | null;
  thumbnail: string | null;
}

interface KPIData {
  total: number;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  medianPrice: number | null;
  avgPriceM2: number | null;
}

export function PropiMagicChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error" }));
        throw new Error(err.error || `Error ${res.status}`);
      }

      // Extract listings, KPIs, and search ID from headers
      let listings: MarketListingData[] = [];
      let kpis: KPIData | undefined;
      const searchId = res.headers.get("X-Search-Id") || undefined;

      const listingsHeader = res.headers.get("X-Listings");
      if (listingsHeader) {
        try {
          listings = JSON.parse(atob(listingsHeader));
        } catch { /* header too large or malformed */ }
      }

      const kpisHeader = res.headers.get("X-KPIs");
      if (kpisHeader) {
        try {
          kpis = JSON.parse(atob(kpisHeader));
        } catch { /* malformed */ }
      }

      // Read stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      // Add assistant message placeholder
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", listings, kpis, searchId },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: fullText,
            listings,
            kpis,
            searchId,
          };
          return updated;
        });
      }

      // Persist messages to DB
      if (searchId) {
        try {
          await updateSearchMessages(searchId, [
            { role: "user", content: userMessage },
            { role: "assistant", content: fullText },
          ]);
        } catch { /* non-critical */ }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Error al buscar",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)] min-h-[400px]">
      {/* Messages - scrollable area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-12 w-12 text-purple-300 mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">
              Propi Magic
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Busca propiedades en el mercado, analiza precios por zona, y
              obtiene insights del mercado inmobiliario.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Apartamentos en Altamira",
                "Casas en venta en Barquisimeto",
                "Oficinas en Las Mercedes de 50-100m2",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {/* User message */}
            {msg.role === "user" && (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] text-sm">
                  {msg.content}
                </div>
              </div>
            )}

            {/* Assistant message */}
            {msg.role === "assistant" && (
              <div className="space-y-2">
                {/* KPIs */}
                {msg.kpis && msg.kpis.total > 0 && (
                  <KPIBar kpis={msg.kpis} />
                )}

                {/* Text summary */}
                {msg.content && (
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[90%] text-sm text-foreground leading-relaxed">
                    {msg.content}
                  </div>
                )}

                {/* Property cards */}
                {msg.listings && msg.listings.length > 0 && (
                  <ListingCards listings={msg.listings} />
                )}

                {/* Link to full zone results */}
                {msg.searchId && (
                  <Link
                    href={`/market-analysis/zone?searchId=${msg.searchId}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Ver todas las propiedades de esta zona
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando en el mercado...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Busca propiedades, analiza mercado..."
          className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-xl bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
