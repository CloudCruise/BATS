"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { ChatSidebar } from "@/components/chat-sidebar";
import { WebPreview, WebPreviewBody, WebPreviewNavigation, WebPreviewUrl } from "@/components/web-preview";
import { StreamingWebPreview } from "@/components/streaming-web-preview";


type SavedSite = { id: string; title: string; url: string; createdAt: number };

type MainConsoleProps = {
  initialUrl?: string;
  onBackToPrompt: () => void;
  generationState?: {
    isGenerating: boolean;
    streamingHtml?: string;
    streamingReasoning?: string;
    title?: string;
  };
};

const STORAGE_KEY = "bats:saved-sites";

export function MainConsole({ initialUrl, onBackToPrompt, generationState }: MainConsoleProps) {
  const [rightOpen, setRightOpen] = useState(true);
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [activeUrl, setActiveUrl] = useState(initialUrl || "");

  // Function to validate if a URL still exists
  const validateUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Function to clean up broken URLs from localStorage
  const cleanupBrokenUrls = useCallback(async (sitesToCheck: SavedSite[]) => {
    const validSites: SavedSite[] = [];
    
    for (const site of sitesToCheck) {
      const isValid = await validateUrl(site.url);
      if (isValid) {
        validSites.push(site);
      }
    }
    
    // Update localStorage and state if any sites were removed
    if (validSites.length !== sitesToCheck.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validSites));
      setSites(validSites);
    }
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsedSites = JSON.parse(raw) as SavedSite[];
        setSites(parsedSites);
        // Clean up broken URLs in the background
        cleanupBrokenUrls(parsedSites);
      } catch {}
    }
  }, [cleanupBrokenUrls]);

  useEffect(() => {
    if (initialUrl) {
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
    }
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
                {generationState?.isGenerating ? (
                  <StreamingWebPreview
                    title={generationState.title}
                    code={generationState.streamingHtml}
                    reasoning={generationState.streamingReasoning}
                  />
                ) : (
                  <WebPreview defaultUrl={activeUrl} onUrlChange={(u) => setActiveUrl(u)} style={{ height: '100%' }}>
                    <WebPreviewNavigation>
                      <div className="flex-1">
                        <WebPreviewUrl src={activeUrl} />
                      </div>
                    </WebPreviewNavigation>
                    <WebPreviewBody src={activeUrl} />
                  </WebPreview>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      {/* Right Sidebar */}
      {rightOpen && (
        <div className="border-l bg-background shadow-sm flex flex-col h-screen" style={{ width: "380px", minWidth: "380px" }}>
          <ChatSidebar open={rightOpen} currentUrl={activeUrl} />
        </div>
      )}
    </SidebarProvider>
  );
}
