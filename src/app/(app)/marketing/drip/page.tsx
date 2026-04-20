import { Zap, Plus, ToggleLeft, ToggleRight, Users, Trash2 } from "lucide-react";
import Link from "next/link";
import { getDripSequences } from "@/server/actions/drip-campaigns";
import type { DripStep } from "@/server/actions/drip-campaigns";
import { DeleteSequenceButton } from "@/components/marketing/drip/delete-sequence-button";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export const dynamic = "force-dynamic";

export default async function DripCampaignsPage() {
  const sequences = await getDripSequences();

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Secuencias
              <InfoTooltip text="Emails automaticos que se envian en orden a tus contactos. Ideal para seguimiento de leads frios." />
            </h1>
            <p className="text-xs text-muted-foreground">
              Emails automaticos que se envian en secuencia a tus contactos
            </p>
          </div>
        </div>
        <Link
          href="/marketing/drip/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva Secuencia
        </Link>
      </div>

      {sequences.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No hay secuencias</p>
          <p className="text-xs mt-1">
            Crea una secuencia para enviar emails automaticos a tus contactos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 max-w-3xl">
          {sequences.map((seq) => {
            const steps = seq.steps as DripStep[];
            const activeCount = seq.enrollments.filter((e) => e.status === "active").length;
            const completedCount = seq.enrollments.filter((e) => e.status === "completed").length;

            return (
              <div
                key={seq.id}
                className="rounded-2xl border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/marketing/drip/${seq.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {seq.active ? (
                        <ToggleRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {seq.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{steps.length} paso{steps.length !== 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {activeCount} activo{activeCount !== 1 ? "s" : ""}
                      </span>
                      <span>{completedCount} completado{completedCount !== 1 ? "s" : ""}</span>
                    </div>
                    {/* Step preview */}
                    <div className="flex gap-1 mt-2">
                      {steps.slice(0, 5).map((step, i) => (
                        <div
                          key={i}
                          className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          Dia {step.delayDays}: {step.subject.slice(0, 20)}
                          {step.subject.length > 20 ? "..." : ""}
                        </div>
                      ))}
                      {steps.length > 5 && (
                        <span className="text-[9px] text-muted-foreground">+{steps.length - 5}</span>
                      )}
                    </div>
                  </Link>
                  <DeleteSequenceButton sequenceId={seq.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
