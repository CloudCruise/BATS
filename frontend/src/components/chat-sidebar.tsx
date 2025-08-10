"use client";

import { useEffect, useRef, useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import type { UIMessage } from "@ai-sdk/react";
import type { ChatStatus } from "ai";

type ChatSidebarProps = {
  open: boolean;
  currentUrl?: string;
  initialPrompt?: string;
  messages?: UIMessage[];
  status?: ChatStatus;
  onSendMessage?: (message: string) => void;
};

const STORAGE_KEY = "bats:right-sidebar-width";

export function ChatSidebar({
  open,
  currentUrl,
  initialPrompt,
  messages = [],
  status = "ready",
  onSendMessage,
}: ChatSidebarProps) {
  const [widthPx, setWidthPx] = useState<number>(380);
  const dragStartX = useRef<number | null>(null);
  const dragStartWidth = useRef<number>(0);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const n = Number(raw);
      if (!Number.isNaN(n)) setWidthPx(Math.min(Math.max(n, 280), 800));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(widthPx));
  }, [widthPx]);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
    dragStartWidth.current = widthPx;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (dragStartX.current == null) return;
    const delta = dragStartX.current - e.clientX; // drag left increases width
    const next = Math.min(Math.max(dragStartWidth.current + delta, 280), 800);
    setWidthPx(next);
  };

  const onMouseUp = () => {
    dragStartX.current = null;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  if (!open) return null;

  return (
    <div
      className="border-l bg-background shadow-sm flex flex-col h-full"
      style={{ width: `${widthPx}px`, minWidth: `${widthPx}px` }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize z-50 hover:bg-border"
        aria-hidden
      />
      <div className="h-full w-full">
        <ChatPanel
          currentUrl={currentUrl}
          initialPrompt={initialPrompt}
          messages={messages}
          status={status}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
}
