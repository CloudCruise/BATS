"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUp } from "lucide-react";

type SavedSite = { id: string; title: string; url: string; createdAt: number };

type LandingProps = {
  onGenerate: (prompt: string, difficulty?: string, websiteType?: string) => Promise<void>;
  onOpenExisting: (url: string) => void;
  isLoading: boolean;
};

const STORAGE_KEY = "bats:saved-sites";

export function Landing({ onGenerate, onOpenExisting, isLoading }: LandingProps) {
  const [prompt, setPrompt] = useState("");
  const [difficulty, setDifficulty] = useState<string>("medium");
  const [websiteType, setWebsiteType] = useState<string>("generic");
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
    await onGenerate(prompt, difficulty, websiteType);
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-12 p-6 text-center text-white relative">
        {/* Flying bats animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="bat-animation bat-1">🦇</div>
          <div className="bat-animation bat-2">🦇</div>
          <div className="bat-animation bat-3">🦇</div>
          <div className="bat-animation bat-4">🦇</div>
          <div className="bat-animation bat-5">🦇</div>
        </div>

        <div className="space-y-6 z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-6xl">🦇</span>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Introducing BATS
            </h1>
            <span className="text-6xl">🦇</span>
          </div>
          <p className="text-white/90 max-w-2xl text-lg leading-relaxed">
            Describe a website scenario to test your browser agents, and we&apos;ll generate it locally for you to iterate on.
          </p>
        </div>

        <div className="w-full max-w-3xl flex flex-col gap-6 z-10">
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-4 md:p-6 shadow-2xl">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isLoading) handleGenerate();
                }
              }}
              rows={1}
              className="min-h-[48px] w-full resize-none bg-transparent px-1 py-2 text-base outline-none placeholder:text-white/70 text-white overflow-hidden"
              placeholder="Ask BATS to build…"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />

            {/* Bottom bar: two dropdowns on the left, send button on the right */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/15">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">🟢 Easy</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="hard">🔴 Hard</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={websiteType} onValueChange={setWebsiteType}>
                  <SelectTrigger className="h-9 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/15">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">🌐 Generic</SelectItem>
                    <SelectItem value="insurance">🛡️ Insurance</SelectItem>
                    <SelectItem value="healthcare">🏥 Healthcare</SelectItem>
                    <SelectItem value="ecommerce">🛒 E-commerce</SelectItem>
                    <SelectItem value="banking">🏦 Banking</SelectItem>
                    <SelectItem value="education">🎓 Education</SelectItem>
                    <SelectItem value="government">🏛️ Government</SelectItem>
                    <SelectItem value="travel">✈️ Travel</SelectItem>
                    <SelectItem value="real-estate">🏠 Real Estate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                size="icon"
                className="rounded-xl h-9 w-9 md:h-10 md:w-10 bg-white text-black hover:bg-white/90"
                aria-label="Send"
                disabled={isLoading || !prompt.trim()}
                onClick={handleGenerate}
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {hasExistingSites && (
          <div className="w-full max-w-3xl z-10">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl">
              <h3 className="text-xl font-semibold mb-6 text-white/95 flex items-center gap-2">
                <span>📚</span>
                Recent websites
              </h3>
              <div className="grid gap-3">
                {savedSites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => onOpenExisting(site.url)}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 text-left border border-white/10 hover:border-white/20 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate group-hover:text-blue-200 transition-colors">
                        {site.title}
                      </div>
                      <div className="text-xs text-white/60 truncate mt-1">{site.url}</div>
                    </div>
                    <div className="text-xs text-white/50 ml-4 flex items-center gap-2">
                      <span>{new Date(site.createdAt).toLocaleDateString()}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </button>
                ))}
              </div>
              {savedSites.length >= 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenExisting(savedSites[0].url)}
                  className="mt-4 text-white/70 hover:text-white hover:bg-white/10 w-full"
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
