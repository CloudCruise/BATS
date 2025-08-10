"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Reasoning,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { UIMessage } from "@ai-sdk/react";
import {
  extractDescription,
  extractDescriptionSummary,
  extractHtmlOnly,
  extractName,
  extractPreamble,
} from "@/utils/extracts";

type StreamingWebPreviewProps = {
  messages: UIMessage[];
  isStreaming?: boolean;
  title?: string;
};

export function StreamingWebPreview({
  messages,
  isStreaming = false,
  title = "Generating website...",
}: StreamingWebPreviewProps) {
  // Extract PREAMBLE content (preferred) or fallback to 'reasoning' parts
  const preambleContent = useMemo(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const lastMessage = assistantMessages[assistantMessages.length - 1];
    if (!lastMessage?.parts) return "";
    const textParts = lastMessage.parts.filter((part) => part.type === "text");
    const rawText = textParts
      .map((part) => ("text" in part ? part.text : ""))
      .join("");
    const fromText = extractPreamble(rawText);
    if (fromText) return fromText;
    // Fallback: use 'reasoning' parts if present
    const reasoningParts = lastMessage.parts.filter(
      (part) => part.type === "reasoning"
    );
    const combined = reasoningParts
      .map((part) => ("text" in part ? part.text : ""))
      .join("");
    return combined
      .split("\n")
      .filter((line) => !/^\s*(PREAMBLE|REASONING|HTML)\s*:?\s*$/i.test(line))
      .join("\n")
      .trim();
  }, [messages]);

  // Extract HTML content and compute fallback reasoning from text parts
  const {
    htmlContent,
    preambleFromText,
    description,
    descriptionSummary,
    name,
  } = useMemo(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const lastMessage = assistantMessages[assistantMessages.length - 1];
    if (!lastMessage?.parts) return { htmlContent: "", preambleFromText: "" };
    const textParts = lastMessage.parts.filter((part) => part.type === "text");
    const rawText = textParts
      .map((part) => ("text" in part ? part.text : ""))
      .join("");
    return {
      htmlContent: extractHtmlOnly(rawText),
      preambleFromText: extractPreamble(rawText),
      description: extractDescription(rawText),
      descriptionSummary: extractDescriptionSummary(rawText),
      name: extractName(rawText),
    };
  }, [messages]);

  const displayReasoning = useMemo(() => {
    const raw = preambleContent || preambleFromText || "";
    // Collapse extra blank lines between bullet points and normalize line endings
    return raw.replace(/\r/g, "").replace(/\n\s*\n+/g, "\n");
  }, [preambleContent, preambleFromText]);

  // Check if we have any content to show
  const hasReasoning = displayReasoning.length > 0;
  const hasHtml = htmlContent.length > 0;
  const hasDescription = description && description.length > 0;
  const hasDescriptionSummary =
    descriptionSummary && descriptionSummary.length > 0;
  const hasName = name && name.length > 0;

  const lines = useMemo(() => {
    if (!htmlContent) {
      return ["Connecting to AI model...", "Initializing generation...", ""];
    }
    return htmlContent.split("\n");
  }, [htmlContent]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4 bg-muted/30">
        <Loader2 className={`h-5 w-5 ${!isStreaming ? "" : "animate-spin"}`} />
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {isStreaming && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto rounded-full"
            disabled
          >
            Generating...
          </Button>
        )}
      </div>
      {/* Reasoning Section - Stacked on top */}
      {hasReasoning && (
        <div className="border-b bg-muted/10 p-4">
          <Reasoning
            isStreaming={isStreaming && hasReasoning}
            open={true}
            className="w-full"
          >
            <ReasoningContent>{displayReasoning}</ReasoningContent>
          </Reasoning>
        </div>
      )}

      {/* HTML Code Section - Takes remaining space */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full rounded-xl border bg-muted/30 p-4 overflow-auto relative">
          {!hasHtml ? (
            // Loading state with hardcoded message
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  Searching the web for reference pages...
                </p>
                <p className="text-sm">
                  Gathering examples and patterns to guide generation
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[auto_1fr] gap-x-4 text-sm font-mono leading-6">
              {lines.map((ln, i) => (
                <div key={i} className="contents">
                  <div className="select-none text-muted-foreground/60 pr-2 text-right w-8">
                    {i + 1}
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-muted-foreground/80">
                    {ln || "\u00A0"}
                  </pre>
                </div>
              ))}
              {/* Blinking cursor effect during streaming */}
              {isStreaming && hasHtml && (
                <div className="contents">
                  <div className="select-none text-muted-foreground/60 pr-2 text-right w-8">
                    {lines.length + 1}
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-muted-foreground/80">
                    <span className="animate-pulse">|</span>
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Fade overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60 rounded-xl" />
        </div>
      </div>
      {hasDescription && (
        <div className="border-b bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      )}
      {hasDescriptionSummary && (
        <div className="border-b bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground">{descriptionSummary}</p>
        </div>
      )}
      {hasName && (
        <div className="border-b bg-muted/10 p-4">
          <p className="text-sm text-muted-foreground">{name}</p>
        </div>
      )}
    </div>
  );
}
