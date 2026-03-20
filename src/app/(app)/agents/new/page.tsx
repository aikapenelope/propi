import { AgentForm } from "@/components/agents/agent-form";

export default function NewAgentPage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nuevo Agente</h1>
      <div className="max-w-2xl">
        <AgentForm />
      </div>
    </div>
  );
}
