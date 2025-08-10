"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { ChatSidebar } from "@/components/chat-sidebar";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewUrl,
} from "@/components/web-preview";
import { Button } from "@/components/ui/button";
import { BotIcon } from "lucide-react";
import { StreamingWebPreview } from "@/components/streaming-web-preview";
import { UIMessage } from "@ai-sdk/react";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "./ui/tabs";

type SavedSite = { id: string; title: string; url: string; createdAt: number };

type MainConsoleProps = {
  initialUrl?: string;
  onBackToPrompt: () => void;
  messages?: UIMessage[];
  isGenerating?: boolean;
  initialPrompt?: string;
};

const STORAGE_KEY = "bats:saved-sites";

export function MainConsole({
  initialUrl,
  onBackToPrompt,
  messages = [],
  isGenerating = false,
  initialPrompt,
}: MainConsoleProps) {
  const [rightOpen, setRightOpen] = useState(true);
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [activeUrl, setActiveUrl] = useState(initialUrl || "");

  // Update activeUrl when initialUrl changes (e.g., after generation completes)
  useEffect(() => {
    if (initialUrl && initialUrl !== activeUrl) {
      setActiveUrl(initialUrl);
    }
  }, [initialUrl, activeUrl]);

  // Function to validate if a URL still exists
  const validateUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
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
            title:
              new URL(initialUrl, location.origin).pathname.split("/").pop() ||
              "site",
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

  return (
    <SidebarProvider
      style={
        {
          "--header-height": "56px",
          "--sidebar-width": "260px",
        } as React.CSSProperties
      }
    >
      {/* <AppSidebar
        variant="inset"
        items={items}
        activeUrl={activeUrl}
        onSelect={(u) => setActiveUrl(u)}
        onDelete={(u) => removeSite(u)}
      /> */}
      <SidebarInset>
        <SiteHeader
          onGenerateNew={onBackToPrompt}
          onToggleChat={() => setRightOpen((s) => !s)}
          isChatOpen={rightOpen}
        />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 p-4 md:p-6">
              <Tabs defaultValue="streaming">
                <div className="flex justify-end">
                  <TabsList>
                    <TabsTrigger value="streaming">Streaming</TabsTrigger>
                    <TabsTrigger value="code">Code</TabsTrigger>
                  </TabsList>
                </div>
                <div className="relative h-[calc(100vh-8rem)] rounded-lg border">
                  <TabsContent value="streaming">
                    <StreamingWebPreview
                      messages={messages}
                      isStreaming={isGenerating}
                    />
                  </TabsContent>
                  <TabsContent value="code" className="h-full">
                    <WebPreview
                      defaultUrl={activeUrl}
                      onUrlChange={(u) => setActiveUrl(u)}
                      style={{ height: "100%" }}
                    >
                      <WebPreviewNavigation className="justify-between">
                        <div className="flex-1 min-w-0">
                          <WebPreviewUrl src={activeUrl} />
                        </div>
                        <div className="shrink-0 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="whitespace-nowrap"
                          >
                            <BotIcon className="w-4 h-4 mr-2" />
                            Agent Mode
                          </Button>
                        </div>
                      </WebPreviewNavigation>
                      <WebPreviewBody src={activeUrl} />
                    </WebPreview>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
      {/* Right Sidebar */}
      {/* <div
        className={`border-l bg-background shadow-sm flex flex-col h-screen transition-all duration-300 ease-in-out overflow-hidden ${
          rightOpen ? "w-[380px] min-w-[380px]" : "w-0 min-w-0"
        }`}
      >
        <div
          className={`transition-opacity duration-300 ${
            rightOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <ChatSidebar
            open={rightOpen}
            currentUrl={activeUrl}
            initialPrompt={initialPrompt}
            messages={messages}
            status={isGenerating ? "streaming" : "ready"}
            onSendMessage={(message) => {
              // For now, we'll just log the message since we don't have a chat API endpoint
              console.log("Chat message:", message);
            }}
          />
        </div>
      </div> */}
    </SidebarProvider>
  );
}
