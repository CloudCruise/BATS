"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelRightIcon } from "lucide-react";

type SiteHeaderProps = {
  onGenerateNew?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
};

export function SiteHeader({ onGenerateNew, onToggleChat, isChatOpen }: SiteHeaderProps) {
  return (
    <div className="h-[var(--header-height,56px)] sticky top-0 z-30 grid grid-cols-3 items-center border-b bg-background/80 backdrop-blur px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="font-semibold">BATS</span>
      </div>
      <div className="flex items-center justify-center">
        <Button variant="outline" size="sm" onClick={onGenerateNew}>Generate new website</Button>
      </div>
      <div className="flex items-center justify-end">
        {onToggleChat && (
          <Button variant="ghost" size="icon" onClick={onToggleChat} aria-label={isChatOpen ? "Hide chat" : "Show chat"}>
            <PanelRightIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}


