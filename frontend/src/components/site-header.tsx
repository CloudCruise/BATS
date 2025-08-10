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
    <div className="h-[var(--header-height,56px)] sticky top-0 z-30 grid grid-cols-3 items-center border-b border-white/10 bg-white/5 backdrop-blur-sm px-4 text-white">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="font-semibold">BATS</span>
      </div>
      <div className="flex items-center justify-center">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-xl bg-white/10 text-white hover:bg_white/15 border border-white/20"
          onClick={onGenerateNew}
        >
          Generate new website
        </Button>
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


