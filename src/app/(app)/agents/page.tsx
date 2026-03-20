import Link from "next/link";
import { Plus, UserCog } from "lucide-react";
import { getAgents } from "@/server/actions/agents";
import { formatDate } from "@/lib/utils";

export default async function AgentsPage() {
  const agentList = await getAgents();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agentes</h1>
          <p className="text-sm text-muted-foreground">
            {agentList.length} agente{agentList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/agents/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Agente</span>
        </Link>
      </div>

      {agentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground">No hay agentes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra tu primer agente.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {agentList.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}/edit`}
              className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <UserCog className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{agent.name}</p>
                <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                  <span>{agent.email}</span>
                  {agent.phone && <span>{agent.phone}</span>}
                  <span>Comision: {agent.commissionRate}%</span>
                </div>
              </div>
              <span
                className={`text-xs font-medium ${agent.isActive ? "text-green-600" : "text-muted-foreground"}`}
              >
                {agent.isActive ? "Activo" : "Inactivo"}
              </span>
              <span className="hidden text-xs text-muted-foreground md:block">
                {formatDate(agent.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
