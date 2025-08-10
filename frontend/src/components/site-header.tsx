"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";

type SiteHeaderProps = {
  onGenerateNew?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  testCaseId?: string | null;
};

export function SiteHeader({
  onGenerateNew,
  onToggleChat,
  isChatOpen,
  testCaseId,
}: SiteHeaderProps) {
  const router = useRouter();
  return (
    <div className="h-[var(--header-height,56px)] sticky top-0 z-30 flex justify-between items-center border-b border-white/10 bg-white/5 backdrop-blur-sm px-4 text-white">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-xl bg-white/10 text-white hover:bg_white/15 border border-white/20"
          onClick={() => {
            // Navigate to the landing page, remove the id from the url if it exists
            const url = new URL(window.location.href);
            url.searchParams.delete("id");
            window.location.href = url.toString();
          }}
        >
          Generate new website
        </Button>
        {testCaseId && (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-xl bg-white/10 text-white hover:bg_white/15 border border-white/20"
            onClick={() => {
              router.push(`/test-cases/${testCaseId}`);
            }}
          >
            See Test Case
          </Button>
        )}
      </div>
      <div className="flex items-center justify-end">
        {onToggleChat && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleChat}
            aria-label={isChatOpen ? "Hide chat" : "Show chat"}
          >
            <PanelRightIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
