"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
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
  const pathname = usePathname();

  return (
    <SidebarGroup>
      
      <SidebarMenu>
        {menu.map((item) => {
          const isActive = item.url === pathname;
          const isCollapsible = item.items?.length;          
          // Open collapsible if any sub-item is active
          const isCurrentPathInSubMenu = isCollapsible && (pathname === item.url || pathname.startsWith(item.url + '/'));
          return (
            <Collapsible key={item.title} open={isCurrentPathInSubMenu} defaultOpen={isCurrentPathInSubMenu}> 
              <SidebarMenuItem>
                
                {isCollapsible ? (
                  // Case 1: Item has sub-menu. The Button must act as the CollapsibleTrigger.
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <div className="flex w-full items-center">
                        {"icon" in item && item.icon ? (
                          <item.icon />
                        ) : (
                          <span aria-hidden="true" className="text-base leading-none">
                            {(item as EmojiMenuItem).emoji}
                          </span>
                        )}
                        <span>{item.title}</span>
                        {/* Chevron is now inside the button and rotates with CollapsibleTrigger state */}
                        <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-90" />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  // Case 2: Direct link.
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link href={item.url}>
                      {"icon" in item && item.icon ? (
                        <item.icon />
                      ) : (
                        <span aria-hidden="true" className="text-base leading-none">
                          {(item as EmojiMenuItem).emoji}
                        </span>
                      )}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
                
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={subItem.url === pathname}>
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>

              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}