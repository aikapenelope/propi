"use client";

import { useState, useEffect, useCallback } from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  Sidebar,
  ConversationList,
  Conversation,
  ChatContainer,
  ConversationHeader,
  MessageList,
  Message,
  MessageInput,
  MessageSeparator,
  Avatar,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import { Instagram, Facebook, MessageCircle } from "lucide-react";
import {
  getConversations,
  getConversation,
  sendMessage,
  markConversationRead,
} from "@/server/actions/messaging";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConversationData = Awaited<ReturnType<typeof getConversations>>[number];
type ConversationDetail = NonNullable<
  Awaited<ReturnType<typeof getConversation>>
>;

// ---------------------------------------------------------------------------
// Platform helpers
// ---------------------------------------------------------------------------

const platformColors: Record<string, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  whatsapp: "#25D366",
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
};

function PlatformIcon({
  platform,
  size = 16,
}: {
  platform: string;
  size?: number;
}) {
  const color = platformColors[platform] || "#6366f1";
  const props = { size, color, strokeWidth: 2 };
  switch (platform) {
    case "instagram":
      return <Instagram {...props} />;
    case "facebook":
      return <Facebook {...props} />;
    default:
      return <MessageCircle {...props} />;
  }
}

function formatTime(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) {
    return d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) {
    return d.toLocaleDateString("es", { weekday: "short" });
  }
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
}

function formatMessageDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return d.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ---------------------------------------------------------------------------
// Main Inbox Component
// ---------------------------------------------------------------------------

interface UnifiedInboxProps {
  initialConversations: ConversationData[];
  initialActiveId?: string;
}

export function UnifiedInbox({ initialConversations, initialActiveId }: UnifiedInboxProps) {
  const [convos, setConvos] = useState<ConversationData[]>(initialConversations);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(initialActiveId || null);
  const [activeDetail, setActiveDetail] = useState<ConversationDetail | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);

  // Load conversation detail when selecting
  const selectConversation = useCallback(async (id: string) => {
    setActiveConvoId(id);
    // On mobile, hide sidebar when selecting a conversation
    if (window.innerWidth < 768) {
      setSidebarVisible(false);
    }
    const detail = await getConversation(id);
    if (detail) {
      setActiveDetail(detail);
      // Mark as read
      if (detail.unreadCount > 0) {
        await markConversationRead(id);
        setConvos((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
        );
      }
    }
  }, []);

  // Send message handler
  async function handleSend(text: string) {
    if (!activeConvoId || !text.trim()) return;
    setSending(true);
    try {
      const msg = await sendMessage(activeConvoId, text);
      // Append to local state
      setActiveDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [msg, ...prev.messages],
        };
      });
      // Update conversation list preview
      setConvos((prev) =>
        prev.map((c) =>
          c.id === activeConvoId
            ? {
                ...c,
                lastMessageAt: new Date(),
                messages: [
                  {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    direction: msg.direction,
                    body: msg.body,
                    externalId: msg.externalId,
                    status: msg.status,
                    metadata: msg.metadata,
                    createdAt: msg.createdAt,
                  },
                ],
              }
            : c,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  // Auto-load initial conversation if provided
  useEffect(() => {
    if (initialActiveId) {
      selectConversation(initialActiveId);
    }
  }, [initialActiveId, selectConversation]);

  // Refresh conversations periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await getConversations(
        filterPlatform as "instagram" | "facebook" | "whatsapp" | undefined,
      );
      setConvos(fresh);
    }, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [filterPlatform]);

  // Filter conversations
  const filteredConvos = filterPlatform
    ? convos.filter((c) => c.platform === filterPlatform)
    : convos;

  // Group messages by date for separators
  const messagesWithSeparators = activeDetail
    ? [...activeDetail.messages].reverse()
    : [];

  const totalUnread = convos.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div
      style={{ height: "calc(100vh - 4rem)", position: "relative" }}
      className="inbox-container md:!h-[calc(100vh-6rem)]"
    >
      <MainContainer responsive>
        {/* Conversation list sidebar */}
        <Sidebar
          position="left"
          scrollable={false}
          style={{
            display: sidebarVisible ? "flex" : "none",
            flexBasis: "320px",
            minWidth: "280px",
            maxWidth: "380px",
          }}
        >
          {/* Filter tabs */}
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--border, #e2e8f0)",
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
              background: "var(--background, #fff)",
            }}
          >
            <FilterButton
              active={!filterPlatform}
              onClick={() => setFilterPlatform(null)}
              label={`Todos${totalUnread > 0 ? ` (${totalUnread})` : ""}`}
            />
            <FilterButton
              active={filterPlatform === "instagram"}
              onClick={() => setFilterPlatform("instagram")}
              label="IG"
              color="#E1306C"
            />
            <FilterButton
              active={filterPlatform === "facebook"}
              onClick={() => setFilterPlatform("facebook")}
              label="FB"
              color="#1877F2"
            />
            <FilterButton
              active={filterPlatform === "whatsapp"}
              onClick={() => setFilterPlatform("whatsapp")}
              label="WA"
              color="#25D366"
            />
          </div>

          <ConversationList>
            {filteredConvos.map((convo) => {
              const lastMsg = convo.messages[0];
              return (
                <Conversation
                  key={convo.id}
                  name={
                    convo.participantName ||
                    convo.participantExternalId ||
                    "Desconocido"
                  }
                  lastSenderName={
                    lastMsg?.direction === "outbound" ? "Tu" : undefined
                  }
                  info={lastMsg?.body || ""}
                  lastActivityTime={formatTime(convo.lastMessageAt)}
                  unreadCnt={convo.unreadCount}
                  active={convo.id === activeConvoId}
                  onClick={() => selectConversation(convo.id)}
                >
                  <Avatar>
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        background: `${platformColors[convo.platform]}15`,
                      }}
                    >
                      <PlatformIcon platform={convo.platform} size={20} />
                    </div>
                  </Avatar>
                </Conversation>
              );
            })}
            {filteredConvos.length === 0 && (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--muted-foreground, #64748b)",
                  fontSize: "13px",
                }}
              >
                No hay conversaciones
                {filterPlatform
                  ? ` en ${platformLabels[filterPlatform]}`
                  : ""}
              </div>
            )}
          </ConversationList>
        </Sidebar>

        {/* Chat area */}
        {activeDetail ? (
          <ChatContainer>
            <ConversationHeader>
              {/* Back button on mobile */}
              <ConversationHeader.Back
                onClick={() => {
                  setSidebarVisible(true);
                  setActiveConvoId(null);
                  setActiveDetail(null);
                }}
              />
              <Avatar>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: `${platformColors[activeDetail.platform]}15`,
                  }}
                >
                  <PlatformIcon platform={activeDetail.platform} size={24} />
                </div>
              </Avatar>
              <ConversationHeader.Content
                userName={
                  activeDetail.participantName ||
                  activeDetail.participantExternalId ||
                  "Desconocido"
                }
                info={platformLabels[activeDetail.platform]}
              />
            </ConversationHeader>

            <MessageList
              typingIndicator={
                sending ? <TypingIndicator content="Enviando..." /> : undefined
              }
            >
              {messagesWithSeparators.map((msg, idx) => {
                // Date separator
                const prevMsg = idx > 0 ? messagesWithSeparators[idx - 1] : null;
                const msgDate = new Date(msg.createdAt).toDateString();
                const prevDate = prevMsg
                  ? new Date(prevMsg.createdAt).toDateString()
                  : null;
                const showSeparator = msgDate !== prevDate;

                return (
                  <div key={msg.id}>
                    {showSeparator && (
                      <MessageSeparator
                        content={formatMessageDate(msg.createdAt)}
                      />
                    )}
                    <Message
                      model={{
                        message: msg.body || "[media]",
                        sentTime: new Date(msg.createdAt).toLocaleTimeString(
                          "es",
                          { hour: "2-digit", minute: "2-digit" },
                        ),
                        sender:
                          msg.direction === "inbound"
                            ? activeDetail.participantName || "Contacto"
                            : "Tu",
                        direction:
                          msg.direction === "inbound" ? "incoming" : "outgoing",
                        position: "single",
                      }}
                    >
                      <Message.Footer
                        sentTime={new Date(msg.createdAt).toLocaleTimeString(
                          "es",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      />
                    </Message>
                  </div>
                );
              })}
              {messagesWithSeparators.length === 0 && (
                <MessageSeparator content="No hay mensajes" />
              )}
            </MessageList>

            <MessageInput
              placeholder="Escribe un mensaje..."
              onSend={(_, textContent) => handleSend(textContent)}
              attachButton={false}
              disabled={sending}
            />
          </ChatContainer>
        ) : (
          /* Empty state when no conversation selected */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              color: "var(--muted-foreground, #64748b)",
              gap: "8px",
            }}
          >
            <MessageCircle size={48} strokeWidth={1} />
            <p style={{ fontSize: "14px" }}>
              Selecciona una conversacion para empezar
            </p>
          </div>
        )}
      </MainContainer>

      {/* Custom CSS overrides for chatscope to match our design system */}
      <style jsx global>{`
        .inbox-container .cs-main-container {
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 8px;
          overflow: hidden;
        }
        .inbox-container .cs-conversation-list {
          background: var(--background, #fff);
        }
        .inbox-container .cs-conversation {
          background: var(--background, #fff);
          border-bottom: 1px solid var(--border, #e2e8f0);
        }
        .inbox-container .cs-conversation--active,
        .inbox-container .cs-conversation:hover {
          background: var(--muted, #f1f5f9);
        }
        .inbox-container .cs-conversation__name {
          color: var(--foreground, #0f172a);
          font-weight: 600;
        }
        .inbox-container .cs-conversation__info {
          color: var(--muted-foreground, #64748b);
        }
        .inbox-container .cs-message-input {
          background: var(--background, #fff);
          border-top: 1px solid var(--border, #e2e8f0);
        }
        .inbox-container .cs-message--incoming .cs-message__content {
          background: var(--muted, #f1f5f9);
          color: var(--foreground, #0f172a);
        }
        .inbox-container .cs-message--outgoing .cs-message__content {
          background: var(--primary, #2563eb);
          color: var(--primary-foreground, #fff);
        }
        .inbox-container .cs-conversation-header {
          background: var(--background, #fff);
          border-bottom: 1px solid var(--border, #e2e8f0);
        }
        .inbox-container .cs-message-list {
          background: var(--background, #fff);
        }
        .inbox-container .cs-message-separator {
          color: var(--muted-foreground, #64748b);
          font-size: 11px;
        }
        .inbox-container .cs-sidebar {
          background: var(--background, #fff);
          border-right: 1px solid var(--border, #e2e8f0);
        }
        @media (prefers-color-scheme: dark) {
          .inbox-container .cs-main-container,
          .inbox-container .cs-conversation-list,
          .inbox-container .cs-conversation,
          .inbox-container .cs-message-input,
          .inbox-container .cs-conversation-header,
          .inbox-container .cs-message-list,
          .inbox-container .cs-sidebar {
            background: var(--background, #0f172a);
          }
          .inbox-container .cs-conversation--active,
          .inbox-container .cs-conversation:hover {
            background: var(--muted, #1e293b);
          }
          .inbox-container .cs-message--incoming .cs-message__content {
            background: var(--muted, #1e293b);
            color: var(--foreground, #f1f5f9);
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter button sub-component
// ---------------------------------------------------------------------------

function FilterButton({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: 600,
        border: "1px solid",
        borderColor: active
          ? color || "var(--primary, #2563eb)"
          : "var(--border, #e2e8f0)",
        background: active ? `${color || "var(--primary, #2563eb)"}15` : "transparent",
        color: active
          ? color || "var(--primary, #2563eb)"
          : "var(--muted-foreground, #64748b)",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
