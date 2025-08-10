"use client";

import { useEffect, useState } from "react";
import { Landing } from "@/components/landing";
import { MainConsole } from "@/components/main-console";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createUserPrompt } from "@/utils/prompt-enrichment";

export default function Home() {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string>("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/generate" }),
  });

  useEffect(() => {
    let stop = false;
    let tries = 0;
    const fetchLatestGenerated = async () => {
      try {
        const res = await fetch("/api/generate", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { urls?: string[] };
        const latest = data.urls?.[0];
        if (latest) setGeneratedUrl(latest);
        else if (!stop && tries < 10) {
          tries += 1;
          setTimeout(fetchLatestGenerated, 300);
        }
      } catch {
        if (!stop && tries < 10) {
          tries += 1;
          setTimeout(fetchLatestGenerated, 300);
        }
      }
    };

    if (generatedUrl === "generating" && status === "ready") {
      fetchLatestGenerated();
    }
    return () => {
      stop = true;
    };
  }, [status, generatedUrl]);

  const handleGenerate = async (
    prompt: string,
    difficulty?: string,
    websiteType?: string
  ) => {
    // Store the initial prompt for display in chat
    setInitialPrompt(prompt);

    // Navigate to main console immediately
    setGeneratedUrl("generating");

    const userPrompt = createUserPrompt(
      prompt,
      difficulty || "medium",
      websiteType || "generic"
    );

    // Send generation request
    sendMessage({ text: JSON.stringify({ prompt: userPrompt }) });
  };

  // Show main console if we have a URL (including during generation)
  if (generatedUrl) {
    return (
      <MainConsole
        initialUrl={generatedUrl === "generating" ? undefined : generatedUrl}
        onBackToPrompt={() => {
          setGeneratedUrl(null);
          setInitialPrompt("");
        }}
        messages={messages}
        isGenerating={status === "streaming"}
        initialPrompt={initialPrompt}
      />
    );
  }

  // Show landing page by default
  return (
    <Landing
      onGenerate={handleGenerate}
      onOpenExisting={(url) => setGeneratedUrl(url)}
      isLoading={status === "streaming"}
    />
  );
}
