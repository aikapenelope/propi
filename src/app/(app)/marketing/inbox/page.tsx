import { getConversations } from "@/server/actions/messaging";
import { UnifiedInbox } from "@/components/inbox/unified-inbox";

export default async function InboxPage() {
  const conversations = await getConversations();

  return <UnifiedInbox initialConversations={conversations} />;
}
