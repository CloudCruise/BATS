"use client";

import { useState, useEffect } from "react";
// import { Send } from "lucide-react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import type { UIMessage } from "@ai-sdk/react";
import type { ChatStatus } from "ai";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";

// Remove the old getMessageText function as we'll handle parts directly

type ChatPanelProps = {
  currentUrl?: string;
  initialPrompt?: string;
  messages?: UIMessage[];
  status?: ChatStatus;
  onSendMessage?: (message: string) => void;
};

export function ChatPanel({
  currentUrl,
  initialPrompt,
  messages = [],
  status = "ready",
  onSendMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [hasShownInitialPrompt, setHasShownInitialPrompt] = useState(false);

  // Show initial prompt as a display-only message when component mounts
  useEffect(() => {
    if (initialPrompt && !hasShownInitialPrompt) {
      setHasShownInitialPrompt(true);
    }
  }, [initialPrompt, hasShownInitialPrompt]);

  // Fetch HTML content when currentUrl changes
  useEffect(() => {
    if (!currentUrl) {
      setHtmlContent(null);
      return;
    }

    const fetchHtmlContent = async () => {
      try {
        const response = await fetch(currentUrl);
        if (response.ok) {
          const html = await response.text();
          setHtmlContent(html);
        } else {
          setHtmlContent(null);
        }
      } catch (error) {
        console.error("Failed to fetch HTML content:", error);
        setHtmlContent(null);
      }
    };

    fetchHtmlContent();
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Include HTML content in the backend message but show only user question in UI
    const messageWithContext = htmlContent
      ? `Current HTML file content:\n\`\`\`html\n${htmlContent}\n\`\`\`\n\nUser question: ${trimmed}`
      : trimmed;

    if (onSendMessage) {
      onSendMessage(messageWithContext);
    }
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">BATS Chat</h2>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start a conversation with the AI assistant</p>
              </div>
            )}
            {/* Show initial prompt if available */}
            {hasShownInitialPrompt &&
              initialPrompt &&
              messages.length === 0 && (
                <Message from="user">
                  <MessageContent>
                    <Response>{initialPrompt}</Response>
                  </MessageContent>
                </Message>
              )}
            {messages.map((message: UIMessage) => {
              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.role === "user" ? (
                      // For user messages, extract just the user question part
                      <Response>
                        {(() => {
                          const textPart = message.parts?.[0];
                          const text =
                            textPart && "text" in textPart
                              ? textPart.text || ""
                              : "";
                          if (text.includes("User question: ")) {
                            return text.split("User question: ")[1] || text;
                          }
                          return text;
                        })()}
                      </Response>
                    ) : (
                      // For assistant messages, render parts normally
                      message.parts?.map((part, i) => {
                        switch (part.type) {
                          case "text": {
                            const raw = "text" in part ? part.text || "" : "";
                            // Prefer <preamble>...</preamble> XML tag
                            const xml = raw.replace(/\r/g, "");
                            const xmlMatch = xml.match(/<preamble>\s*([\s\S]*?)\s*<\/preamble>/i);
                            let preamble = xmlMatch && xmlMatch[1] ? xmlMatch[1].trim() : "";
                            if (!preamble) {
                              const match = xml.match(/(?:^|\n)\s*(?:1\)\s*)?PREAMBLE\s*:?\s*\n([\s\S]*?)(?:\n\s*(?:2\)\s*)?HTML\b)/i);
                              preamble = match && match[1]
                                ? match[1]
                                    .split("\n")
                                    .filter((line) => !/^\s*(PREAMBLE|HTML)\s*:?\s*$/i.test(line))
                                    .join("\n")
                                    .replace(/\n\s*\n+/g, "\n")
                                    .trim()
                                : "";
                            }

                            if (preamble) {
                              return (
                                <Reasoning
                                  key={`${message.id}-${i}`}
                                  className="w-full"
                                  defaultOpen={true}
                                  isStreaming={
                                    status === "streaming" &&
                                    message.id === messages[messages.length - 1]?.id &&
                                    i === (message.parts?.length || 1) - 1
                                  }
                                >
                                  <ReasoningTrigger />
                                  <ReasoningContent>{preamble}</ReasoningContent>
                                </Reasoning>
                              );
                            }
                            return (
                              <Response key={`${message.id}-${i}`}>
                                {raw}
                              </Response>
                            );
                          }
                          case "reasoning":
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                className="w-full"
                                defaultOpen={true}
                                isStreaming={
                                  status === "streaming" &&
                                  message.id ===
                                    messages[messages.length - 1]?.id &&
                                  i === (message.parts?.length || 1) - 1
                                }
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>
                                  {"text" in part ? part.text : ""}
                                </ReasoningContent>
                              </Reasoning>
                            );
                          default:
                            return null;
                        }
                      })
                    )}
                  </MessageContent>
                </Message>
              );
            })}
            {status === "streaming" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="p-4 border-t border-border">
        <PromptInput onSubmit={handleSubmit} className="relative">
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={status !== "ready"}
            minHeight={48}
            maxHeight={120}
            className="pr-12"
          />
          <PromptInputToolbar>
            <PromptInputSubmit
              className="absolute right-2 bottom-2"
              disabled={!input.trim() || status !== "ready"}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
