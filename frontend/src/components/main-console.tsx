"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { ChatSidebar } from "@/components/chat-sidebar";
import { WebPreview, WebPreviewBody, WebPreviewNavigation, WebPreviewUrl } from "@/components/web-preview";

type SavedSite = { id: string; title: string; url: string; createdAt: number };

type MainConsoleProps = {
  initialUrl: string;
  onBackToPrompt: () => void;
};

const STORAGE_KEY = "bats:saved-sites";

export function MainConsole({ initialUrl, onBackToPrompt }: MainConsoleProps) {
  const [rightOpen, setRightOpen] = useState(true);
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [activeUrl, setActiveUrl] = useState(initialUrl);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSites(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    setActiveUrl(initialUrl);
    // Save to iterations if it's new
    setSites((prev) => {
      if (prev.some((s) => s.url === initialUrl)) return prev;
      const next: SavedSite[] = [
        {
          id: crypto.randomUUID(),
          title: new URL(initialUrl, location.origin).pathname.split("/").pop() || "site",
          url: initialUrl,
          createdAt: Date.now(),
        },
        ...prev,
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [initialUrl]);

  const items = sites.map((s) => ({ name: s.title, url: s.url }));

  return (
    <SidebarProvider 
      style={{ 
        "--header-height": "56px",
        "--sidebar-width": "260px" 
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" items={items} activeUrl={activeUrl} onSelect={(u) => setActiveUrl(u)} />
      <SidebarInset>
        <SiteHeader onGenerateNew={onBackToPrompt} onToggleChat={() => setRightOpen((s) => !s)} isChatOpen={rightOpen} />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 p-4 md:p-6">
              <div className="relative h-[calc(100vh-8rem)] rounded-lg border">
                <WebPreview defaultUrl={activeUrl} onUrlChange={(u) => setActiveUrl(u)} style={{ height: '100%' }}>
                  <WebPreviewNavigation>
                    <div className="flex-1">
                      <WebPreviewUrl src={activeUrl} />
                    </div>
                  </WebPreviewNavigation>
                  <WebPreviewBody src={activeUrl} />
                </WebPreview>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      {/* Right Sidebar */}
      {rightOpen && (
        <div className="border-l bg-background shadow-sm flex flex-col h-screen" style={{ width: "380px", minWidth: "380px" }}>
          <ChatSidebar open={rightOpen} />
        </div>
      )}
    </SidebarProvider>
  );
}
