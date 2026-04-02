"use client";

import { useState, useRef, useEffect } from "react";
import { BarChart3, Send, Loader2 } from "lucide-react";
import { AnalysisPanel } from "./analysis-panel";
import { SimilarListings } from "./similar-listings";
import type { CleanedListing } from "@/lib/mercadolibre";
import type { AnalysisResult } from "@/lib/groq";
import { parseAnalysisResponse } from "@/lib/groq";

interface AnalysisChatProps {
  propertyId: string;
}

export function AnalysisChat({ propertyId }: AnalysisChatProps) {
  const [listings, setListings] = useState<CleanedListing[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [streamText, setStreamText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [followUpMessages, setFollowUpMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamText, followUpMessages]);

  async function runAnalysis() {
    setIsLoading(true);
    setError(null);
    setStreamText("");
    setAnalysis(null);
    setListings([]);

    try {
      const res = await fetch("/api/market-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error || `Error ${res.status}`);
      }

      // Extract listings from header
      const listingsHeader = res.headers.get("X-Listings");
      if (listingsHeader) {
        try {
          const decoded = JSON.parse(atob(listingsHeader)) as CleanedListing[];
          setListings(decoded);
        } catch {
          // Listings header too large or malformed, skip
        }
      }

      // Read stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setStreamText(fullText);
      }

      // Parse final result
      const parsed = parseAnalysisResponse(fullText);
      if (parsed) {
        setAnalysis(parsed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUp.trim() || isLoading) return;

    const question = followUp.trim();
    setFollowUp("");
    setFollowUpMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/market-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, followUpQuestion: question }),
      });

      if (!res.ok) throw new Error("Error en la consulta");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
      }

      setFollowUpMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer },
      ]);
    } catch {
      setFollowUpMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al procesar la pregunta." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Initial state: show button to start analysis
  if (!analysis && !isLoading && !streamText) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BarChart3 className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">
          Analisis de Mercado
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Busca propiedades similares en MercadoLibre y analiza precios,
          tendencias y competencia con IA.
        </p>
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}
        <button
          onClick={runAnalysis}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          Analizar Mercado
        </button>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="space-y-6 overflow-y-auto">
      {/* Loading state */}
      {isLoading && !analysis && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            {streamText ? "Analizando datos..." : "Buscando propiedades en MercadoLibre..."}
          </span>
        </div>
      )}

      {/* Analysis results */}
      {analysis && <AnalysisPanel analysis={analysis} />}

      {/* Similar listings */}
      {listings.length > 0 && (
        <SimilarListings
          listings={listings}
          similarIndices={analysis?.similar_indices}
        />
      )}

      {/* Follow-up messages */}
      {followUpMessages.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase">
            Preguntas
          </h3>
          {followUpMessages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-2xl p-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground ml-8"
                  : "bg-muted text-foreground mr-8"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Follow-up input */}
      {analysis && (
        <form onSubmit={handleFollowUp} className="flex gap-2">
          <input
            type="text"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            placeholder="Pregunta sobre el mercado..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !followUp.trim()}
            className="rounded-xl bg-primary px-4 py-2.5 text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      )}
    </div>
  );
}
