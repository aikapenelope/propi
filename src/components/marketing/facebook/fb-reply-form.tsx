"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { replyToFbComment } from "@/server/actions/facebook";

export function FbReplyForm({ postId }: { postId: string }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await replyToFbComment(postId, message);
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder="Responder..."
        className="h-8 flex-1 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {sent ? <span className="text-xs">ok</span> : <Send className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
