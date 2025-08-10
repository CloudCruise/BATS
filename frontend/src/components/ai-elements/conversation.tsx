"use client";

import type { ComponentProps } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ConversationContextValue = {
  scrollToBottom: () => void;
  isAtBottom: boolean;
};

const ConversationContext = createContext<ConversationContextValue | null>(
  null
);

const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("Conversation components must be used within Conversation");
  }
  return context;
};

export type ConversationProps = ComponentProps<"div">;

export const Conversation = ({
  className,
  children,
  ...props
}: ConversationProps) => {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setIsAtBottom(atBottom);
    }
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  });

  return (
    <ConversationContext.Provider value={{ scrollToBottom, isAtBottom }}>
      <div
        ref={scrollRef}
        className={cn("flex-1 overflow-y-auto", className)}
        onScroll={handleScroll}
        {...props}
      >
        {children}
      </div>
    </ConversationContext.Provider>
  );
};

export type ConversationContentProps = ComponentProps<"div">;

export const ConversationContent = ({
  className,
  children,
  ...props
}: ConversationContentProps) => {
  return (
    <div
      className={cn("p-4 space-y-4 max-h-[500px] overflow-y-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { scrollToBottom, isAtBottom } = useConversation();

  if (isAtBottom) return null;

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "absolute bottom-20 right-4 rounded-full shadow-lg",
        className
      )}
      onClick={scrollToBottom}
      {...props}
    >
      <ChevronDownIcon className="h-4 w-4" />
    </Button>
  );
};

Conversation.displayName = "Conversation";
ConversationContent.displayName = "ConversationContent";
ConversationScrollButton.displayName = "ConversationScrollButton";
