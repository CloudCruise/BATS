"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"

type StreamingOverlayProps = {
  open?: boolean
  onClose?: () => void
  title?: string
  code?: string
  speed?: number // ms per character
  autoCloseDelayMs?: number // delay after completion before closing
}

export default function StreamingOverlay({
  open = false,
  onClose = () => {},
  title = "Generating website...",
  code = "",
  speed = 12,
  autoCloseDelayMs = 1200,
}: StreamingOverlayProps) {
  const [cursor, setCursor] = useState(0)
  const [done, setDone] = useState(false)
  const timerRef = useRef<number | null>(null)

  const chars = useMemo(() => code.split(""), [code])
  const displayed = useMemo(() => chars.slice(0, cursor).join(""), [chars, cursor])

  useEffect(() => {
    if (!open) return
    setCursor(0)
    setDone(false)
  }, [open, code])

  useEffect(() => {
    if (!open) return
    if (cursor >= chars.length) {
      setDone(true)
      if (autoCloseDelayMs >= 0) {
        const t = window.setTimeout(() => onClose(), autoCloseDelayMs)
        return () => window.clearTimeout(t)
      }
      return
    }
    timerRef.current = window.setInterval(() => {
      setCursor((c) => Math.min(c + Math.max(1, Math.round(3 * Math.random())), chars.length))
    }, speed)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [open, cursor, chars.length, speed, autoCloseDelayMs, onClose])

  const lines = useMemo(() => displayed.split("\n"), [displayed])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center bg-background">
      {/* Top bar with spinner and title */}
      <div className="w-full max-w-5xl px-6 pt-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className={`h-5 w-5 ${done ? "" : "animate-spin"}`} />
            <h3 className="text-2xl md:text-[28px] font-semibold tracking-tight">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {!done && (
              <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setCursor(chars.length)}>
                {"Skip"}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Background faint code */}
        <div className="relative mt-8">
          <div className="relative rounded-xl border bg-muted/30 p-4 md:p-6 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 text-sm md:text-base font-mono leading-6">
              {lines.map((ln, i) => (
                <div key={i} className="contents">
                  <div className="select-none text-muted-foreground/60 pr-2 text-right w-8">{i + 1}</div>
                  <pre className="whitespace-pre-wrap break-words text-muted-foreground/80">{ln || "\u00A0"}</pre>
                </div>
              ))}
            </div>

            {/* Fade overlay to mimic screenshot's washout */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
          </div>
        </div>
      </div>
    </div>
  )
}