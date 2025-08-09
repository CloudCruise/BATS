"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

type SiteHeaderProps = {
  onGenerateNew?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
};

export function SiteHeader({ onGenerateNew, onToggleChat, isChatOpen }: SiteHeaderProps) {
  return (
    <div className="h-[var(--header-height,56px)] sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 backdrop-blur px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="font-semibold">BATS</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onGenerateNew}>Generate new website</Button>
        <Button variant="ghost" size="sm" onClick={onToggleChat}>{isChatOpen ? "Hide chat" : "Show chat"}</Button>
        <div className="text-sm text-muted-foreground hidden md:block">GitHub</div>
      </div>
    </div>
  );
}


