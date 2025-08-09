"use client";

import { useState } from "react";
import { Landing } from "@/components/landing";
import { MainConsole } from "@/components/main-console";

export default function Home() {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (prompt: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await res.json()) as { url?: string };
      if (data?.url) setGeneratedUrl(data.url);
    } finally {
      setIsLoading(false);
    }
  };

  if (generatedUrl) {
    return (
      <MainConsole initialUrl={generatedUrl} onBackToPrompt={() => setGeneratedUrl(null)} />
    );
  }

  return (
    <Landing 
      onGenerate={handleGenerate} 
      onOpenExisting={(url) => setGeneratedUrl(url)}
      isLoading={isLoading} 
    />
  );
}
