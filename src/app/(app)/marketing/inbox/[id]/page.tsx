import { notFound } from "next/navigation";
import { getConversation, getConversations } from "@/server/actions/messaging";
import { UnifiedInbox } from "@/components/inbox/unified-inbox";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) {
    notFound();
  }

  const allConversations = await getConversations();

  return (
    <UnifiedInbox
      initialConversations={allConversations}
      initialActiveId={id}
    />
  );
}
