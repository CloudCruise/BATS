"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { FilesIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AppSidebarItem = { name: string; url: string };

export type AppSidebarProps = {
  items: AppSidebarItem[];
  activeUrl?: string | null;
  onSelect?: (url: string) => void;
  onDelete?: (url: string) => void;
  onCleanup?: () => void;
  className?: string;
  variant?: "sidebar" | "floating" | "inset";
};

export function AppSidebar({ items, activeUrl, onSelect, onDelete, onCleanup, className, variant = "inset" }: AppSidebarProps) {
  return (
    <Sidebar variant={variant} collapsible="icon" className={className}>
      <SidebarRail />
      <SidebarContent className="overflow-visible">
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Websites</SidebarGroupLabel>
            {onCleanup && items.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-60 hover:opacity-100"
                onClick={onCleanup}
                title="Clean up broken links"
              >
                <Trash2Icon className="w-3 h-3" />
              </Button>
            )}
          </div>
          <SidebarMenu>
            {items.length === 0 ? (
              <div className="px-2 py-4 text-xs text-muted-foreground">
                No websites generated yet
              </div>
            ) : (
              items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={activeUrl === item.url}
                    onClick={() => onSelect?.(item.url)}
                  >
                    <FilesIcon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    aria-label="Delete"
                    title="Delete"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Optimistically update UI
                      onDelete?.(item.url);
                      try {
                        await fetch(`/api/generate`, {
                          method: "DELETE",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ url: item.url }),
                        });
                      } catch {
                        // swallow errors; UI already updated
                      }
                    }}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
    </Sidebar>
  );
}


