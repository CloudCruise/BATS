"use client";

import { useState } from "react";
import { Landing } from "@/components/landing";
import { MainConsole } from "@/components/main-console";



export default function Home() {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<{
    isGenerating: boolean;
    streamingHtml?: string;
    title?: string;
  }>({ isGenerating: false });

  const handleGenerate = async (prompt: string, difficulty?: string, websiteType?: string) => {
    const title = `Generating ${prompt.trim().split(/\s+/).slice(0, 2).join("-") || "index"}.html`;
    
    // Immediately navigate to main console with generating state
    setGenerationState({ 
      isGenerating: true, 
      streamingHtml: undefined,
      title 
    });
    setGeneratedUrl("generating"); // Temporary URL to show main console

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          difficulty: difficulty || 'medium', 
          websiteType: websiteType || 'generic' 
        }),
      });
      const data = (await res.json()) as { url?: string; html?: string };
      
      if (data?.html) {
        setGenerationState(prev => ({ 
          ...prev, 
          streamingHtml: data.html 
        }));
      }
      
      if (data?.url) {
        // Complete generation and set real URL after streaming
        setTimeout(() => {
          setGeneratedUrl(data.url!);
          setGenerationState({ isGenerating: false });
        }, 2000); // Give time for streaming to complete
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setGenerationState({ isGenerating: false });
      setGeneratedUrl(null);
    }
  };

  // Show main console if we have a URL (including during generation)
  if (generatedUrl) {
    return (
      <MainConsole 
        initialUrl={generatedUrl === "generating" ? undefined : generatedUrl}
        generationState={generationState}
        onBackToPrompt={() => {
          setGeneratedUrl(null);
          setGenerationState({ isGenerating: false });
        }} 
      />
    );
  }

  // Show landing page by default
  return (
    <Landing 
      onGenerate={handleGenerate} 
      onOpenExisting={(url) => setGeneratedUrl(url)}
      isLoading={false} 
    />
  );
}
