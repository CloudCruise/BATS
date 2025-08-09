"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Loader } from '@/components/ai-elements/loader';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';

// Remove the old getMessageText function as we'll handle parts directly

type ChatPanelProps = {
  currentUrl?: string;
};

export function ChatPanel({ currentUrl }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

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
    
    sendMessage({ text: messageWithContext });
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
      
      <Conversation>
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Start a conversation with the AI assistant</p>
            </div>
          )}
          {messages.map((message: UIMessage) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.role === 'user' ? (
                  // For user messages, extract just the user question part
                  <Response>
                    {(() => {
                      const textPart = message.parts?.[0];
                      const text = (textPart && 'text' in textPart) ? textPart.text || '' : '';
                      if (text.includes('User question: ')) {
                        return text.split('User question: ')[1] || text;
                      }
                      return text;
                    })()}
                  </Response>
                ) : (
                  // For assistant messages, render parts normally
                  message.parts?.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {'text' in part ? part.text : ''}
                          </Response>
                        );
                      case 'reasoning':
                        return (
                          <Reasoning
                            key={`${message.id}-${i}`}
                            className="w-full"
                            isStreaming={status === 'streaming' && i === (message.parts?.length || 1) - 1}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{'text' in part ? part.text : ''}</ReasoningContent>
                          </Reasoning>
                        );
                      default:
                        return null;
                    }
                  })
                )}
              </MessageContent>
            </Message>
          ))}
          {status === 'streaming' && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-4 border-t border-border">
        <PromptInput onSubmit={handleSubmit} className="relative">
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={status !== "ready"}
            minHeight={48}
            maxHeight={120}
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
