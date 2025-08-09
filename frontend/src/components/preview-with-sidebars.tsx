"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageCircle, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { WebPreview, WebPreviewBody, WebPreviewNavigation, WebPreviewUrl } from "@/components/web-preview";

type SavedSite = { id: string; title: string; url: string; createdAt: number };

type PreviewProps = {
  url: string;
  onBackToPrompt: () => void;
};

const STORAGE_KEY = "bats:saved-sites";

export function PreviewWithSidebars({ url, onBackToPrompt }: PreviewProps) {
  const [rightOpen, setRightOpen] = useState(true);
  const [leftOpen, setLeftOpen] = useState(true);
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

  const gridTemplate = useMemo(() => {
    const left = leftOpen ? 260 : 0;
    const right = rightOpen ? 380 : 0;
    return `${left}px 1fr ${right}px`;
  }, [leftOpen, rightOpen]);

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ display: "grid", gridTemplateColumns: gridTemplate }}>
      {/* Left sidebar: sites list */}
      <div className={cn("border-r border-border bg-background h-full", leftOpen ? "opacity-100" : "opacity-0 pointer-events-none")}> 
        <div className="p-3 flex items-center justify-between border-b border-border">
          <div className="font-medium">Iterations</div>
          <Button variant="ghost" size="icon" onClick={() => setLeftOpen(false)} aria-label="Collapse left sidebar">
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-48px)]">
          {sites.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No sites yet</div>
          ) : (
            <ul>
              {sites.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setActiveUrl(s.url)}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-accent",
                      activeUrl === s.url && "bg-accent"
                    )}
                  >
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.url}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Center preview */}
      <div className="relative h-full">
        {/* Left expand button when collapsed */}
        {!leftOpen && (
          <button
            aria-label="Expand left sidebar"
            onClick={() => setLeftOpen(true)}
            className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur px-3 py-2 text-sm"
          >
            <PanelLeftOpen className="w-4 h-4" /> Sites
          </button>
        )}
        {/* Right toggle button */}
        <button
          aria-label="Toggle chat sidebar"
          onClick={() => setRightOpen((s) => !s)}
          className="absolute top-4 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur px-3 py-2 text-sm"
        >
          <MessageCircle className="w-4 h-4" /> {rightOpen ? "Hide" : "Show"} chat
        </button>

        <button
          aria-label="Generate new website"
          onClick={onBackToPrompt}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 backdrop-blur px-3 py-2 text-sm"
        >
          Generate new website
        </button>

        <WebPreview defaultUrl={activeUrl} onUrlChange={(u) => setActiveUrl(u)}>
          <WebPreviewNavigation>
            <div className="flex-1">
              <WebPreviewUrl />
            </div>
          </WebPreviewNavigation>
          <WebPreviewBody />
        </WebPreview>
      </div>

      {/* Right sidebar: chat */}
      <div className={cn("border-l border-border bg-background h-full", rightOpen ? "opacity-100" : "opacity-0 pointer-events-none")}> 
        <ChatPanel />
      </div>
    </div>
  );
}


