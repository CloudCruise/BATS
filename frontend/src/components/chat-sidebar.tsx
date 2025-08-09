"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { cn } from "@/lib/utils";

type ChatSidebarProps = {
  open: boolean;
};

export function ChatSidebar({ open }: ChatSidebarProps) {
  return (
    <Sidebar side="right" variant="inset" collapsible="none" className={cn(!open && "hidden md:block md:[&_[data-slot=sidebar-container]]:hidden")}> 
      <div className="h-full w-full">
        <ChatPanel />
      </div>
    </Sidebar>
  );
}


