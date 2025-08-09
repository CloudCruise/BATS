"use client";

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
    <div className={cn("flex items-center gap-1 border-b p-2", className)} {...props}>
      {children}
    </div>
  );
}

export type WebPreviewUrlProps = ComponentProps<typeof Input> & { src?: string };
export function WebPreviewUrl({ value, src, onChange, onKeyDown, ...props }: WebPreviewUrlProps) {
  const { url, setUrl } = useWebPreview();
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const target = event.target as HTMLInputElement;
      setUrl(target.value);
    }
    onKeyDown?.(event);
  };

  return (
    <Input
      className="flex-1 h-8 text-sm"
      placeholder="Enter URL..."
      value={value ?? src ?? url}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}

export type WebPreviewBodyProps = ComponentProps<"iframe"> & { loading?: ReactNode };
export function WebPreviewBody({ className, loading, src, ...props }: WebPreviewBodyProps) {
  const { url } = useWebPreview();
  return (
    <div className="flex-1">
      <iframe className={cn("size-full", className)} src={src ?? url} title="Preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation" {...props} />
      {loading}
    </div>
  );
}


