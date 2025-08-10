"use client";
import { useSidebar } from "./ui/sidebar";
import { cn } from "@/lib/utils";

export function SidebarInset({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();
  return (
    <div
      className={cn(
        "transition-all duration-200 h-screen",
        open ? "pl-64" : "pl-12"
      )}
    >
      {children}
    </div>
  );
}
