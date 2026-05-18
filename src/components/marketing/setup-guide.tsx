"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";

interface Step {
  text: string;
  link?: { url: string; label: string };
}

export function SetupGuide({ title, steps }: { title: string; steps: Step[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 rounded-lg border border-border/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {title}
      </button>
      {open && (
        <ol className="px-3 pb-3 space-y-2">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5">
                {step.text}
                {step.link && (
                  <>
                    {" "}
                    <a
                      href={step.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-primary hover:underline"
                    >
                      {step.link.label}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
