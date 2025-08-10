"use client";

import { createContext, useContext, useState, type ComponentProps, type ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";

export type WebPreviewContextValue = {
  url: string;
  setUrl: (url: string) => void;
};

const WebPreviewContext = createContext<WebPreviewContextValue | null>(null);

function useWebPreview() {
  const ctx = useContext(WebPreviewContext);
  if (!ctx) throw new Error("WebPreview components must be used within a WebPreview");
  return ctx;
}

export type WebPreviewProps = ComponentProps<"div"> & {
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
};

export function WebPreview({ className, children, defaultUrl = "", onUrlChange, ...props }: WebPreviewProps) {
  const [url, setUrlState] = useState(defaultUrl);
  const setUrl = (u: string) => {
    setUrlState(u);
    onUrlChange?.(u);
  };
  return (
    <WebPreviewContext.Provider value={{ url, setUrl }}>
      <div className={cn("flex size-full flex-col rounded-lg border bg-card", className)} {...props}>
        {children}
      </div>
    </WebPreviewContext.Provider>
  );
}

export type WebPreviewNavigationProps = ComponentProps<"div">;
export function WebPreviewNavigation({ className, children, ...props }: WebPreviewNavigationProps) {
  return (
    <div className={cn("flex items-center gap-2 border-b p-2 rounded-t-lg w-full min-w-0", className)} {...props}>
      {children}
    </div>
  );
}

export type WebPreviewUrlProps = ComponentProps<typeof Input> & { src?: string };
export function WebPreviewUrl({ value, src, onChange, onKeyDown, className, ...props }: WebPreviewUrlProps) {
  const { url, setUrl } = useWebPreview();
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const target = event.target as HTMLInputElement;
      setUrl(target.value);
    }
    onKeyDown?.(event);
  };

  const currentValue = value ?? src ?? url;
  const hrefValue = typeof currentValue === "string" && currentValue.length > 0 ? currentValue : undefined;

  return (
    <div className="relative w-full">
      <a
        href={hrefValue}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open in new tab"
        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <ExternalLinkIcon className="w-4 h-4" />
      </a>
      <Input
        className={cn("h-8 text-sm pl-8", className)}
        placeholder="Enter URL..."
        value={currentValue}
        onChange={onChange}
        readOnly={!onChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
}

export type WebPreviewBodyProps = ComponentProps<"iframe"> & { loading?: ReactNode };
export const WebPreviewBody = forwardRef<HTMLIFrameElement, WebPreviewBodyProps>(function WebPreviewBody(
  { className, loading, src, ...props },
  ref
) {
  const { url } = useWebPreview();
  return (
    <div className="flex-1">
      <iframe
        ref={ref}
        className={cn("size-full", className)}
        src={src ?? (url || undefined)}
        title="Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        {...props}
      />
      {loading}
    </div>
  );
});

// Maintained for potential future external placement if needed
export type WebPreviewOpenExternalProps = ComponentProps<typeof Button> & { href?: string };
export function WebPreviewOpenExternal({ href, className, ...props }: WebPreviewOpenExternalProps) {
  const { url } = useWebPreview();
  const targetHref = href ?? url;
  return (
    <Button asChild variant="ghost" size="icon" className={cn("shrink-0", className)} {...props}>
      <a href={targetHref} target="_blank" rel="noopener noreferrer" aria-label="Open in new tab">
        <ExternalLinkIcon className="w-4 h-4" />
      </a>
    </Button>
  );
}


