"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { AgentPanel } from "./agent-panel";
import { type AgentAction } from "@/agent/main-agent";

type Tab = "agent";

type TabbedSidebarProps = {
  open: boolean;
  currentUrl?: string;
  agentRunning: boolean;
  onAgentToggle: () => void;
  agentActions?: AgentAction[];
  uiMessages?: Array<{ id: string; role: 'assistant' | 'user'; parts: Array<{ type: string; text?: string }> }>;
};

const STORAGE_KEY = "bats:right-sidebar-width";

export function TabbedSidebar({ open, currentUrl, agentRunning, onAgentToggle, agentActions = [], uiMessages = [] }: TabbedSidebarProps) {
  const [widthPx, setWidthPx] = useState<number>(380);
  const [activeTab] = useState<Tab>("agent");
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
    const delta = dragStartX.current - e.clientX;
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
      className="border-l border-white/10 bg-white/5 backdrop-blur-md text-white shadow-sm flex flex-col h-full min-h-0"
      style={{ width: `${widthPx}px`, minWidth: `${widthPx}px` }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize z-50 hover:bg-border"
        aria-hidden
      />
      
      {/* Header */}
      <div className="flex border-b border-white/10 bg-white/5">
        <Button variant="secondary" size="sm" className="flex-1 rounded-none justify-start gap-2 bg-transparent text-white/90 hover:bg-white/10" disabled>
          <Bot className="w-4 h-4" />
          Agent Mode
        </Button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "agent" && (
          <AgentPanel
            currentUrl={currentUrl}
            agentRunning={agentRunning}
            onAgentToggle={onAgentToggle}
            actions={agentActions}
            uiMessages={uiMessages}
          />
        )}
      </div>
    </div>
  );
}
