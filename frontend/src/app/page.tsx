"use client";

import { useEffect, useState } from "react";
import { Landing } from "@/components/landing";
import { MainConsole } from "@/components/main-console";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function Home() {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  
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

  const handleGenerate = async (prompt: string, difficulty?: string, websiteType?: string) => {
    // Navigate to main console immediately
    setGeneratedUrl("generating");
    
    // Include generation parameters in the message
    const messageText = `Generate a website with the following parameters:
Prompt: ${prompt}
Difficulty: ${difficulty || 'medium'}
Website Type: ${websiteType || 'generic'}`;
    
    // Send generation request
    sendMessage({ text: messageText });
  };

  // Show main console if we have a URL (including during generation)
  if (generatedUrl) {
    return (
      <MainConsole 
        initialUrl={generatedUrl === "generating" ? undefined : generatedUrl}
        onBackToPrompt={() => {
          setGeneratedUrl(null);
        }}
        messages={messages}
        isGenerating={status === 'streaming'}
      />
    );
  }

  // Show landing page by default
  return (
    <Landing 
      onGenerate={handleGenerate} 
      onOpenExisting={(url) => setGeneratedUrl(url)}
      isLoading={status === 'streaming'} 
    />
  );
}