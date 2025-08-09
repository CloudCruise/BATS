"use client";

import { useState } from "react";
import { InitialPrompt } from "@/components/initial-prompt";
import { PreviewWithSidebars } from "@/components/preview-with-sidebars";

export default function Home() {
  const [prompt, setPrompt] = useState(
    "I want to build a website that throws an unexpected popup while my browser agent interacts with it"
  );
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
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
      <PreviewWithSidebars url={generatedUrl} onBackToPrompt={() => setGeneratedUrl(null)} />
    );
  }

  return (
    <InitialPrompt
      prompt={prompt}
      onChange={setPrompt}
      onGenerate={handleGenerate}
      isLoading={isLoading}
    />
  );
}
