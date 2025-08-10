"use client";

import { useEffect, useState, useCallback, useRef } from "react";
// import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { TabbedSidebar } from "@/components/tabbed-sidebar";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewUrl,
} from "@/components/web-preview";
import { StreamingWebPreview } from "@/components/streaming-web-preview";
import { UIMessage } from "@ai-sdk/react";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "./ui/tabs";
import { PageAgent, AgentRunner, type AgentAction } from "@/agent/main-agent";
import { BotIcon } from "lucide-react";
import { Button } from "./ui/button";

type SavedSite = { id: string; title: string; url: string; createdAt: number };

type MainConsoleProps = {
  initialUrl?: string;
  onBackToPrompt: () => void;
  messages?: UIMessage[];
  isGenerating?: boolean;
};

const STORAGE_KEY = "bats:saved-sites";
const CONTINUOUS_MODE = false;

export function MainConsole({
  initialUrl,
  onBackToPrompt,
  messages = [],
  isGenerating = false,
}: MainConsoleProps) {
  const [rightOpen, setRightOpen] = useState(true);
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [activeUrl, setActiveUrl] = useState(initialUrl || "");

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const pageRef = useRef<PageAgent | null>(null);
  const runnerRef = useRef<AgentRunner | null>(null);
  const [uiMessages, setUIMessages] = useState<
    Array<{
      id: string;
      role: "assistant" | "user";
      parts: Array<{ type: string; text?: string }>;
    }>
  >([]);

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

  useEffect(() => {
    if (!agentRunning) return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (!pageRef.current) pageRef.current = new PageAgent(iframe);
    else pageRef.current.attach(iframe);
  }, [agentRunning, activeUrl]);

  const onAgentClick = async () => {
    if (agentRunning) {
      runnerRef.current?.abort();
      setAgentRunning(false);
      return;
    }
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Reset actions when starting new agent run
    setAgentActions([]);

    const page = new PageAgent(iframe);
    pageRef.current = page;

    // Create callback to stream actions in real-time
    const onAction = (action: AgentAction) => {
      setAgentActions((prev) => {
        const existing = prev.find((a) => a.id === action.id);
        if (existing) {
          // Update existing action
          return prev.map((a) => (a.id === action.id ? action : a));
        } else {
          // Add new action
          return [...prev, action];
        }
      });
    };

    const runner = new AgentRunner(page, CONTINUOUS_MODE, onAction, (msgs) =>
      setUIMessages(msgs)
    );
    runnerRef.current = runner;
    setAgentRunning(true);

    try {
      // Guard iframe from navigation while agent is running
      page.enableNavGuards(true);
      if (CONTINUOUS_MODE) {
        await runner.runLoop(
          "Disrupt browser automation with new buttons, moved buttons, and more."
        );
      } else {
        // Use the new runIterations method for 3 iterations
        await runner.runIterations(
          "Disrupt browser automation with new buttons, moved buttons, and more.",
          3
        );
      }
    } finally {
      // Remove guards and stop running state
      page.enableNavGuards(false);
      setAgentRunning(false);
    }
  };

  // const items = sites.map((s) => ({ name: s.title, url: s.url }));

  // const removeSite = (targetUrl: string) => {
  //   setSites((prev) => {
  //     const next = prev.filter((s) => s.url !== targetUrl);
  //     localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  //     if (activeUrl === targetUrl) {
  //       setActiveUrl(next[0]?.url ?? "");
  //     }
  //     return next;
  //   });
  // };

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
                      <WebPreviewBody src={activeUrl} ref={iframeRef} />
                    </WebPreview>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
      {/* Right Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          rightOpen ? "w-[380px] min-w-[380px]" : "w-0 min-w-0"
        }`}
      >
        <div
          className={`transition-opacity duration-300 ${
            rightOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <TabbedSidebar
            open={rightOpen}
            currentUrl={activeUrl}
            agentRunning={agentRunning}
            onAgentToggle={onAgentClick}
            agentActions={agentActions}
            uiMessages={uiMessages}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}
