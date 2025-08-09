"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning"

type StreamingWebPreviewProps = {
  title?: string
  code?: string
  reasoning?: string
  speed?: number // ms per character
}

export function StreamingWebPreview({
  title = "Generating website...",
  code = "",
  reasoning = "",
  speed = 12,
}: StreamingWebPreviewProps) {
  const [cursor, setCursor] = useState(0)
  const [done, setDone] = useState(false)
  const [isRealStreaming, setIsRealStreaming] = useState(false)
  const timerRef = useRef<number | null>(null)
  const previousCodeLength = useRef(0)

  const chars = useMemo(() => code.split(""), [code])
  const displayed = useMemo(() => {
    // If we're getting real streaming data, show it directly
    if (isRealStreaming) {
      return code;
    }
    // Otherwise use the simulated streaming effect
    return chars.slice(0, cursor).join("");
  }, [chars, cursor, code, isRealStreaming])

  // Detect if we're receiving real streaming data
  useEffect(() => {
    if (code.length > previousCodeLength.current && code.length > 0) {
      setIsRealStreaming(true)
      setDone(false)
      // Reset cursor when we start getting real streaming
      if (previousCodeLength.current === 0) {
        setCursor(0)
      }
    }
    previousCodeLength.current = code.length
  }, [code])

  // Reset state when code changes (new generation starts)
  useEffect(() => {
    if (code === "" || code.length === 0) {
      setCursor(0)
      setDone(false)
      setIsRealStreaming(false)
      previousCodeLength.current = 0
    }
  }, [code])

  // Handle simulated streaming when we have complete code but not real streaming
  useEffect(() => {
    if (isRealStreaming) {
      return // Don't simulate if we're getting real streaming
    }

    if (cursor >= chars.length && chars.length > 0) {
      setDone(true)
      return
    }
    
    if (chars.length > 0) {
      timerRef.current = window.setInterval(() => {
        setCursor((c) => Math.min(c + Math.max(1, Math.round(3 * Math.random())), chars.length))
      }, speed)
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current)
      }
    }
  }, [cursor, chars.length, speed, isRealStreaming])

  // Mark as done when real streaming appears to be complete
  useEffect(() => {
    if (isRealStreaming && code.length > 0) {
      // Use a timeout to detect when streaming has stopped
      const timeoutId = setTimeout(() => {
        if (code.includes('</html>')) {
          setDone(true)
        }
      }, 1000)
      
      return () => clearTimeout(timeoutId)
    }
  }, [code, isRealStreaming])

  const lines = useMemo(() => {
    if (!displayed && !isRealStreaming) {
      return ["Connecting to AI model...", "Initializing generation...", ""];
    }
    return displayed.split("\n");
  }, [displayed, isRealStreaming])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4 bg-muted/30">
        <Loader2 className={`h-5 w-5 ${done ? "" : "animate-spin"}`} />
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {!done && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto rounded-full" 
            onClick={() => setCursor(chars.length)}
          >
            Skip
          </Button>
        )}
      </div>

      {/* Reasoning Section */}
      {reasoning && (
        <div className="p-4 border-b bg-muted/10">
          <Reasoning isStreaming={!done && reasoning.length > 0} defaultOpen={true}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoning}</ReasoningContent>
          </Reasoning>
        </div>
      )}

      {/* Code display */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full rounded-xl border bg-muted/30 p-4 overflow-auto relative">
          {!displayed && !isRealStreaming ? (
            // Loading state with hardcoded message
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Generating website...</p>
                <p className="text-sm">AI is creating your custom HTML page</p>
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
              {!done && isRealStreaming && (
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
    </div>
  )
}
