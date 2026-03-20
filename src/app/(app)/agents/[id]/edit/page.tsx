import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAgent } from "@/server/actions/agents";
import { AgentForm } from "@/components/agents/agent-form";

interface EditAgentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6">
      <Link
        href="/agents"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Agentes
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Editar Agente
      </h1>
      <div className="max-w-2xl">
        <AgentForm agent={agent} />
      </div>
    </div>
  );
}
