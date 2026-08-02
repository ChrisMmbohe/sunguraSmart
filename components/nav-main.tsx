"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type BaseMenuItem = {
  title: string
  url: string
  isActive?: boolean
  items?: { title: string; url: string }[]
}

type IconMenuItem = BaseMenuItem & { icon: LucideIcon; emoji?: never }
type EmojiMenuItem = BaseMenuItem & { emoji: string; icon?: never }
type MenuItem = IconMenuItem | EmojiMenuItem

function ItemIcon({ item }: { item: MenuItem }) {
  return "icon" in item && item.icon ? (
    <item.icon />
  ) : (
    <span aria-hidden="true" className="text-base leading-none">
      {(item as EmojiMenuItem).emoji}
    </span>
  )
}

export function NavMain({
  menu = [],
  items,
}: {
  menu?: MenuItem[]
  items?: MenuItem[]
}) {
  const pathname = usePathname();
  const resolvedMenu = items ?? menu;

  return (
    <SidebarGroup>
      <SidebarMenu>
        {resolvedMenu.map((item) => {
          const isActive = item.url === pathname;
          const isCollapsible = Boolean(item.items?.length);

          // Leaf items (the overwhelming majority here — every current
          // entry in data.menu has no `items`) never need Collapsible,
          // CollapsibleContent, or SidebarMenuSub at all. Those wrap a
          // Radix Presence tree (with its own useId()) that was previously
          // mounted for every single link regardless of whether it could
          // ever expand — dead DOM that also happened to be the exact
          // subtree showing the hydration id mismatch. Rendering leaf
          // items as plain buttons removes that subtree entirely instead
          // of just hiding it.
          if (!isCollapsible) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={cn(
                    "transition-all duration-300 rounded-xl hover:bg-muted hover:shadow-lg",
                    isActive && "bg-primary/10 border border-primary/5 shadow-lg dark:shadow-muted"
                  )}
                >
                  <Link href={item.url}>
                    <ItemIcon item={item} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          const isCurrentPathInSubMenu =
            pathname === item.url || pathname.startsWith(item.url + "/");

          return (
            <Collapsible key={item.title} open={isCurrentPathInSubMenu} defaultOpen={isCurrentPathInSubMenu}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className="transition-all duration-300 rounded-xl hover:bg-muted hover:shadow-lg"
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex w-full items-center">
                      <ItemIcon item={item} />
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]:rotate-90" />
                    </div>
                  </CollapsibleTrigger>
                </SidebarMenuButton>

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
