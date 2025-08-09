"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { FilesIcon } from "lucide-react";

export type AppSidebarItem = { name: string; url: string };

export type AppSidebarProps = {
  items: AppSidebarItem[];
  activeUrl?: string | null;
  onSelect?: (url: string) => void;
  className?: string;
  variant?: "sidebar" | "floating" | "inset";
};

export function AppSidebar({ items, activeUrl, onSelect, className, variant = "inset" }: AppSidebarProps) {
  return (
    <Sidebar variant={variant} collapsible="icon" className={className}>
      <SidebarRail />
      <SidebarContent className="overflow-visible">
        <SidebarGroup>
          <SidebarGroupLabel>Websites</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  isActive={activeUrl === item.url}
                  onClick={() => onSelect?.(item.url)}
                >
                  <FilesIcon className="w-4 h-4" />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
    </Sidebar>
  );
}


