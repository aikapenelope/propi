"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { sendIgMessage, replyToIgComment, commentOnIgMedia } from "@/server/actions/instagram";

interface IgReplyFormProps {
  /** dm = send DM, comment = new comment on post, reply = reply to existing comment */
  type: "dm" | "comment" | "reply";
  /** For DM: recipient user ID. For comment: media ID. For reply: comment ID */
  targetId: string;
}

export function IgReplyForm({ type, targetId }: IgReplyFormProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      if (type === "dm") {
        await sendIgMessage(targetId, message);
      } else if (type === "reply") {
        await replyToIgComment(targetId, message);
      } else {
        await commentOnIgMedia(targetId, message);
      }
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-2 flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder={
          type === "dm" ? "Escribe un mensaje..." : "Responder comentario..."
        }
        className="h-8 flex-1 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {sent ? (
          <span className="text-xs">ok</span>
        ) : (
          <Send className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
