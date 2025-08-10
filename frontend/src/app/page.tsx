"use client";

import { useState, useRef, useEffect } from "react";
import { Landing } from "@/components/landing";
import { MainConsole } from "@/components/main-console";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { createUserPrompt } from "@/utils/prompt-enrichment";

export default function Home() {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string>("");
  const isGeneratingRef = useRef(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/generate" }),
  });

  // Watch for when generation completes
  useEffect(() => {
    const fetchGeneratedUrl = async () => {
      try {
        const res = await fetch("/api/generate", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { urls?: string[] };
          const latest = data.urls?.[0];
          if (latest) {
            setGeneratedUrl(latest);
            isGeneratingRef.current = false;
          }
        }
      } catch (error) {
        console.error("Failed to fetch latest generated URL:", error);
      }
    };

    // When status changes from streaming to ready, and we were generating
    if (status === "ready" && isGeneratingRef.current) {
      // Small delay to ensure file is written
      setTimeout(fetchGeneratedUrl, 1000);
    }
  }, [status]);

  const handleGenerate = async (
    prompt: string,
    difficulty?: string,
    websiteType?: string
  ) => {
    // Store the initial prompt for display in chat
    setInitialPrompt(prompt);

    // Navigate to main console immediately
    setGeneratedUrl("generating");
    isGeneratingRef.current = true;

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
          isGeneratingRef.current = false;
        }}
        messages={messages}
        isGenerating={status === "streaming"}
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
