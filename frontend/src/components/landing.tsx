"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type SavedSite = { id: string; title: string; url: string; createdAt: number };

type LandingProps = {
  onGenerate: (prompt: string) => Promise<void>;
  onOpenExisting: (url: string) => void;
  isLoading: boolean;
};

const STORAGE_KEY = "bats:saved-sites";

export function Landing({ onGenerate, onOpenExisting, isLoading }: LandingProps) {
  const [prompt, setPrompt] = useState(
    "I want to build a website that throws an unexpected popup while my browser agent interacts with it"
  );
  const [savedSites, setSavedSites] = useState<SavedSite[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const sites = JSON.parse(raw) as SavedSite[];
        setSavedSites(sites.slice(0, 3)); // Show only the 3 most recent
      } catch {}
    }
  }, []);

  const handleGenerate = async () => {
    await onGenerate(prompt);
  };

  const hasExistingSites = savedSites.length > 0;

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0d1b2a] via-[#0f2742] to-[#1b1f3a]" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 300px at 20% 0%, rgba(255,255,255,0.12), transparent 70%), radial-gradient(800px 300px at 80% 0%, rgba(255,255,255,0.08), transparent 70%)",
        }}
      />
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 text-center text-white">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold">Introducing BATS</h1>
          <p className="text-white/80 max-w-xl">
            Describe a website scenario to test your browser agents, and we&apos;ll generate it locally for you to iterate on.
          </p>
        </div>

        <div className="w-full max-w-2xl flex flex-col gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading) handleGenerate();
              }
            }}
            rows={4}
            className="w-full bg-white/10 text-white placeholder:text-white/60 rounded-lg border border-white/20 p-4 resize-none focus:outline-none focus:ring-2 focus:ring-white/30"
            placeholder="Describe the website behavior you want to test..."
          />
          <div className="flex justify-center">
            <Button onClick={handleGenerate} disabled={isLoading} size="lg">
              {isLoading ? "Generating..." : "Generate website"}
            </Button>
          </div>
        </div>

        {hasExistingSites && (
          <div className="w-full max-w-2xl">
            <div className="border-t border-white/20 pt-6">
              <h3 className="text-lg font-medium mb-4 text-white/90">Recent websites</h3>
              <div className="grid gap-2">
                {savedSites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => onOpenExisting(site.url)}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left border border-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{site.title}</div>
                      <div className="text-xs text-white/60 truncate">{site.url}</div>
                    </div>
                    <div className="text-xs text-white/50 ml-4">
                      {new Date(site.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
              {savedSites.length >= 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenExisting(savedSites[0].url)}
                  className="mt-3 text-white/70 hover:text-white"
                >
                  View all websites →
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
