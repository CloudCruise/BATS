"use client";

import { useEffect, useState } from "react";
import { WebPreview, WebPreviewBody, WebPreviewNavigation, WebPreviewUrl } from "@/components/web-preview";
import { Button } from "@/components/ui/button";
import { BotIcon } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { ChatSidebar } from "@/components/chat-sidebar";

type SavedSite = { id: string; title: string; url: string; createdAt: number };

type PreviewProps = {
  url: string;
  onBackToPrompt: () => void;
};

const STORAGE_KEY = "bats:saved-sites";

export function PreviewWithSidebars({ url, onBackToPrompt }: PreviewProps) {
  const [rightOpen, setRightOpen] = useState(true);
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [activeUrl, setActiveUrl] = useState(url);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSites(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    setActiveUrl(url);
    // Save to iterations if it's new
    setSites((prev) => {
      if (prev.some((s) => s.url === url)) return prev;
      const next: SavedSite[] = [
        {
          id: crypto.randomUUID(),
          title: new URL(url, location.origin).pathname.split("/").pop() || "site",
          url,
          createdAt: Date.now(),
        },
        ...prev,
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [url]);

  const items = sites.map((s) => ({ name: s.title, url: s.url }));

  const removeSite = (targetUrl: string) => {
    setSites((prev) => {
      const next = prev.filter((s) => s.url !== targetUrl);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (activeUrl === targetUrl && next.length > 0) {
        setActiveUrl(next[0].url);
      }
      return next;
    });
  };

  return (
    <SidebarProvider style={{ "--header-height": "56px" } as React.CSSProperties}>
      {/* Left Sidebar */}
      <AppSidebar
        items={items}
        activeUrl={activeUrl}
        onSelect={(u) => setActiveUrl(u)}
        onDelete={(u) => removeSite(u)}
      />
      {/* Main inset */}
      <SidebarInset className="gap-2">
        <SiteHeader onGenerateNew={onBackToPrompt} onToggleChat={() => setRightOpen((s) => !s)} isChatOpen={rightOpen} />
        <div className="flex-1 overflow-hidden">
          <div className="relative h-full rounded-lg border">
            <WebPreview defaultUrl={activeUrl} onUrlChange={(u) => setActiveUrl(u)} style={{ height: '100%' }}>
              <WebPreviewNavigation>
                <div className="flex-1 min-w-0">
                  <WebPreviewUrl src={activeUrl} />
                </div>
                <Button variant="outline" size="sm" className="ml-2 whitespace-nowrap shrink-0" type="button">
                  <BotIcon className="w-4 h-4 mr-2" />
                  Agent Mode
                </Button>
              </WebPreviewNavigation>
              <WebPreviewBody src={activeUrl} />
            </WebPreview>
          </div>
        </div>
      </SidebarInset>
      {/* Right Sidebar sibling to inset so it overlays properly */}
      <ChatSidebar open={rightOpen} />
    </SidebarProvider>
  );
}


