"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Support either an icon or an emoji for each item
type BaseSecondaryItem = {
  title: string
  url: string
}

type IconSecondaryItem = BaseSecondaryItem & {
  icon: LucideIcon
  emoji?: never
}

type EmojiSecondaryItem = BaseSecondaryItem & {
  emoji: string
  icon?: never
}

type SecondaryItem = IconSecondaryItem | EmojiSecondaryItem

export function NavSecondary({
  items,
  ...props
}: {
  items: SecondaryItem[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.url === pathname;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm" isActive={isActive} tooltip={item.title}>
                  <Link href={item.url}>
                    {"icon" in item && item.icon ? (
                      <item.icon />
                    ) : (
                      <span aria-hidden="true" className="text-base leading-none">
                        {item.emoji}
                      </span>
                    )}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}