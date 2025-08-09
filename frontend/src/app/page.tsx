"use client";

import { useState } from "react";
import { Landing } from "@/components/landing";
import { MainConsole } from "@/components/main-console";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function Home() {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/generate" }),
  });

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