"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

// types for menu items supporting either icon or emoji
type BaseMenuItem = {
  title: string
  url: string
  isActive?: boolean
  // Optional nested items if you use submenus
  items?: { title: string; url: string }[]
  // Some code referenced item.menu?.length; keep optional for compatibility
  menu?: unknown[]
}

type IconMenuItem = BaseMenuItem & {
  icon: LucideIcon
  emoji?: never
}

type EmojiMenuItem = BaseMenuItem & {
  emoji: string
  icon?: never
}

type MenuItem = IconMenuItem | EmojiMenuItem

// components/nav-main.tsx
export function NavMain({
  menu = [],
}: {
  menu?: MenuItem[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {menu.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  {"icon" in item && item.icon ? (
                    <item.icon />
                  ) : (
                    <span aria-hidden="true" className="text-base leading-none">
                      {(item as EmojiMenuItem).emoji}
                    </span>
                  )}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>

              {item.menu?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
