"use client";

import { useState } from "react";
import { MessageCircle, ImageIcon } from "lucide-react";
import { IgReplyForm } from "./ig-reply-form";

interface IgMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  permalink?: string;
}

interface IgConversation {
  id: string;
  participants: { data: { id: string; username: string }[] };
  messages?: {
    data: {
      id: string;
      message?: string;
      from: { id: string; username?: string };
      created_time: string;
    }[];
  };
}

interface IgInboxTabsProps {
  media: IgMedia[];
  conversations: IgConversation[];
}

export function IgInboxTabs({ media, conversations }: IgInboxTabsProps) {
  const [tab, setTab] = useState<"dms" | "posts">("dms");

  return (
    <div>
      {/* Tab buttons */}
      <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab("dms")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "dms"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageCircle className="mr-1 inline h-4 w-4" />
          Mensajes Directos
        </button>
        <button
          onClick={() => setTab("posts")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "posts"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ImageIcon className="mr-1 inline h-4 w-4" />
          Posts y Comentarios
        </button>
      </div>

      {/* DMs tab */}
      {tab === "dms" && (
        <div className="space-y-3">
          {conversations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay conversaciones recientes
            </p>
          ) : (
            conversations.map((conv) => {
              const otherUser = conv.participants.data[0];
              const lastMsg = conv.messages?.data[0];
              return (
                <div
                  key={conv.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-sm">
                      @{otherUser?.username || "usuario"}
                    </span>
                    {lastMsg && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(lastMsg.created_time).toLocaleDateString(
                          "es",
                        )}
                      </span>
                    )}
                  </div>
                  {/* Recent messages */}
                  {conv.messages?.data.slice(0, 3).map((msg) => (
                    <div key={msg.id} className="mb-1 text-sm">
                      <span className="font-medium text-foreground">
                        {msg.from.username || "tu"}:
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {msg.message || "(media)"}
                      </span>
                    </div>
                  ))}
                  {/* Reply form */}
                  <IgReplyForm
                    type="dm"
                    targetId={conv.participants.data[0]?.id || ""}
                  />
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Posts tab */}
      {tab === "posts" && (
        <div className="space-y-3">
          {media.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay posts recientes
            </p>
          ) : (
            media.map((post) => (
              <div
                key={post.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-start gap-3">
                  {post.media_url && (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.media_url}
                        alt={post.caption || "Post"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground line-clamp-2">
                      {post.caption || "(sin caption)"}
                    </p>
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      <span>{post.like_count || 0} likes</span>
                      <span>{post.comments_count || 0} comentarios</span>
                      <span>
                        {new Date(post.timestamp).toLocaleDateString("es")}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Reply to comments on this post */}
                {(post.comments_count || 0) > 0 && (
                  <div className="mt-2 border-t border-border pt-2">
                    <IgReplyForm type="comment" targetId={post.id} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
