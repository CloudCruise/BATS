"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type StreamingWebPreviewProps = {
  title?: string
  code?: string
  speed?: number // ms per character
}

export function StreamingWebPreview({
  title = "Generating website...",
  code = "",
  speed = 12,
}: StreamingWebPreviewProps) {
  const [cursor, setCursor] = useState(0)
  const [done, setDone] = useState(false)
  const timerRef = useRef<number | null>(null)

  const chars = useMemo(() => code.split(""), [code])
  const displayed = useMemo(() => chars.slice(0, cursor).join(""), [chars, cursor])

  useEffect(() => {
    setCursor(0)
    setDone(false)
  }, [code])

  useEffect(() => {
    if (cursor >= chars.length) {
      setDone(true)
      return
    }
    timerRef.current = window.setInterval(() => {
      setCursor((c) => Math.min(c + Math.max(1, Math.round(3 * Math.random())), chars.length))
    }, speed)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [cursor, chars.length, speed])

  const lines = useMemo(() => displayed.split("\n"), [displayed])

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

      {/* Code display */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full rounded-xl border bg-muted/30 p-4 overflow-auto">
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
          </div>

          {/* Fade overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
