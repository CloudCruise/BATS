"use client";

import { useState } from "react";
import { Landing } from "@/components/landing";
import { MainConsole } from "@/components/main-console";



export default function Home() {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<{
    isGenerating: boolean;
    streamingHtml?: string;
    streamingReasoning?: string;
    title?: string;
  }>({ isGenerating: false });

  const handleGenerate = async (prompt: string, difficulty?: string, websiteType?: string) => {
    const words = prompt.trim().split(/\s+/).filter(word => word.length > 0);
    const titleWords = words.slice(0, 3).join(" ");
    const title = `Generating ${titleWords || "website"}...`;
    
    // Immediately navigate to main console with generating state
    setGenerationState({ 
      isGenerating: true, 
      streamingHtml: "",
      streamingReasoning: "",
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

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";
        
        // Process complete lines
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'reasoning') {
                setGenerationState(prev => ({ 
                  ...prev, 
                  streamingReasoning: data.fullReasoning || prev.streamingReasoning + data.content
                }));
              } else if (data.type === 'html_start' || data.type === 'html_delta') {
                setGenerationState(prev => ({ 
                  ...prev, 
                  streamingHtml: data.fullHtml || prev.streamingHtml + data.content
                }));
              } else if (data.type === 'delta') {
                // Fallback for old format
                setGenerationState(prev => ({ 
                  ...prev, 
                  streamingHtml: data.fullContent || prev.streamingHtml + data.content
                }));
              } else if (data.type === 'complete') {
                // Generation complete, set final URL
                setTimeout(() => {
                  setGeneratedUrl(data.url);
                  setGenerationState({ isGenerating: false });
                }, 1000); // Brief delay to show completion
              }
            } catch (parseError) {
              console.warn("Failed to parse streaming data:", parseError);
            }
          }
        }
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
