"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type InitialPromptProps = {
  prompt: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  isLoading?: boolean;
  existingUrl?: string | null;
  onOpenExisting?: () => void;
};

export function InitialPrompt({ prompt, onChange, onGenerate, isLoading, existingUrl, onOpenExisting }: InitialPromptProps) {
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center text-white">
        <h1 className="text-4xl font-semibold">Introducing BATS</h1>
        <p className="text-white/80 max-w-xl">
          Describe a website scenario to test your browser agents, and we’ll generate it locally for you to iterate on.
        </p>
        <div className="w-full max-w-2xl flex flex-col gap-3">
          <Textarea
            value={prompt}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isLoading) onGenerate();
              }
            }}
            rows={4}
            className="w-full bg-white/10 text-white placeholder:text-white/60"
          />
          <div className="flex justify-center gap-3">
            <Button onClick={onGenerate} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate website"}
            </Button>
            {existingUrl ? (
              <Button variant="secondary" onClick={onOpenExisting}>Open generated website</Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}


