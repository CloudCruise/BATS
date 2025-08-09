"use client";

import { useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { PromptInput, PromptTextarea, PromptToolbar, PromptSubmit } from "@/components/prompt-input";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

function getMessageText(message: unknown): string {
  const m = message as {
    text?: string;
    content?: string;
    parts?: Array<{ type: string; text?: string }>;
  };
  if (typeof m?.text === "string") return m.text;
  if (typeof m?.content === "string") return m.content;
  if (Array.isArray(m?.parts)) {
    return m.parts
      .map((p) => (p.type === "text" && typeof p.text === "string" ? p.text : ""))
      .join("");
  }
  return "";
}

export function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">BATS Chat</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Start a conversation with the AI assistant</p>
          </div>
        )}
        {messages.map((m: UIMessage) => (
          <div key={m.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {m.role === "user" ? (
                <User className="w-4 h-4 text-primary" />
              ) : (
                <Bot className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="text-sm text-foreground whitespace-pre-wrap flex-1 pt-1">
              {getMessageText(m)}
            </div>
          </div>
        ))}
        {status !== "ready" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground pt-1">Thinking...</div>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border">
        <PromptInput onSubmit={handleSubmit}>
          <PromptTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={status !== "ready"}
          />
          <PromptToolbar>
            <div />
            <PromptSubmit disabled={!input.trim() || status !== "ready"}>
              <Send className="w-4 h-4" />
            </PromptSubmit>
          </PromptToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
