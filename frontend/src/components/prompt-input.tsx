"use client";

import { useCallback, useEffect, useRef, type ComponentProps, type HTMLAttributes, type KeyboardEventHandler } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Square, X } from "lucide-react";
import type { ChatStatus } from "ai";

type UseAutoResizeTextareaProps = { minHeight: number; maxHeight?: number };

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) textarea.style.height = `${minHeight}px`;
  }, [minHeight]);

  useEffect(() => {
    const handler = () => adjustHeight();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export type PromptInputProps = HTMLAttributes<HTMLFormElement>;

export function PromptInput({ className, ...props }: PromptInputProps) {
  return (
    <form
      className={cn(
        "w-full divide-y overflow-hidden rounded-xl border bg-background shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export type PromptTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
};

export function PromptTextarea({
  onChange,
  className,
  placeholder = "Type your message…",
  minHeight = 48,
  maxHeight = 164,
  ...props
}: PromptTextareaProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight, maxHeight });

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      form?.requestSubmit();
    }
  };

  return (
    <Textarea
      className={cn(
        "w-full resize-none rounded-none border-none p-3 shadow-none outline-none ring-0",
        "bg-transparent dark:bg-transparent focus-visible:ring-0",
        className
      )}
      name="message"
      onChange={(e) => {
        adjustHeight();
        onChange?.(e);
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      ref={textareaRef}
      {...props}
    />
  );
}

export type PromptToolbarProps = HTMLAttributes<HTMLDivElement>;
export function PromptToolbar({ className, ...props }: PromptToolbarProps) {
  return <div className={cn("flex items-center justify-between p-1", className)} {...props} />;
}

export type PromptSubmitProps = ComponentProps<typeof Button> & { status?: ChatStatus };
export function PromptSubmit({ className, variant = "default", size = "icon", status, children, ...props }: PromptSubmitProps) {
  let Icon = <Send className="w-4 h-4" />;
  if (status === "submitted") Icon = <Loader2 className="w-4 h-4 animate-spin" />;
  else if (status === "streaming") Icon = <Square className="w-4 h-4" />;
  else if (status === "error") Icon = <X className="w-4 h-4" />;

  return (
    <Button className={cn("gap-1.5 rounded-lg", className)} size={size} type="submit" variant={variant} {...props}>
      {children ?? Icon}
    </Button>
  );
}


