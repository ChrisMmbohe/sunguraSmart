"use client"

import Link from "next/link"
import {
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react"
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Support either an icon or an emoji for each project
type BaseProjectItem = {
  name: string
  url: string
}

type IconProjectItem = BaseProjectItem & {
  icon: LucideIcon
  emoji?: never
}

type EmojiProjectItem = BaseProjectItem & {
  emoji: string
  icon?: never
}

type ProjectItem = IconProjectItem | EmojiProjectItem

export function NavProjects({
  projects,
}: {
  projects: ProjectItem[]
}) {
  const { isMobile } = useSidebar()
  const pathname = usePathname();

  return (
    <SidebarGroup>
      
      <SidebarMenu>
        {projects.map((item) => {
          const isActive = item.url === pathname;
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                <Link href={item.url}>
                  {"icon" in item && item.icon ? (
                    <item.icon />
                  ) : (
                    <span aria-hidden="true" className="text-base leading-none">
                      {item.emoji}
                    </span>
                  )}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
              {/* ... dropdown menu content remains the same */}
            </SidebarMenuItem>
          )
        })}
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="More Projects">
            <MoreHorizontal />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}