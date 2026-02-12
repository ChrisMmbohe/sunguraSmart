"use client"

import * as React from "react"
import {
   LogIn,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {ThemeLogo} from "@/components/ui/themelogo";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import {Button} from "@/components/ui/button";
import Link from "next/link"
import { Separator } from "./ui/separator"


const data = {
      menu: [
        {
            title: "Dashboard",
            url: "/dashboard",
            emoji: "📊",
            
        },
        {
            title: "Rabbits",
            url: "/rabbits",
            emoji: "🐰",

        },
        {
            title: "Breeding",
            url: "/breeding",
            emoji: "🔗",

        },
        {
            title: "Litters",
            url: "/litters",
            emoji: "🐾",

        },
        {
            title: "Schedule",
            url: "/schedule",
            emoji: "🗓",
        },
         {
            title: "Health",
            url: "/health",
            emoji: "🩺",
            
        },
         {
            title: "Finances",
            url: "/finances",
            emoji: "💰",
            
        },
         {
            title: "Cage Cards",
            url: "/cagecards",
           emoji: "📇",
            
        },
         {
            title: "Reports",
            url: "/reports",
            emoji: "📈",            
        },
    ],
    navSecondary: [
        {
            title: "Support",
            url: "#",
            emoji: "⛑️",
        },
        {
            title: "Feedback",
            url: "#",
            emoji: "📝",
        },
    ],
    projects: [
        {
            name: "Online Store",
            url: "#",
            emoji: "🛒",
        },
        {
            name: "Market Place",
            url: "#",
            emoji: "🏬",
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip="SUNGURA SMART">
                            <Link href="/">
                                <ThemeLogo />
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">SUNGURA SMART</span>
                                    <span className="truncate text-xs">Digital Farm Manager</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="flex-1 overflow-y-auto">
                <NavMain menu={data.menu as { title: string; url: string; emoji: string; isActive?: boolean }[]} />                <Separator />
                <NavProjects projects={data.projects} />
                <Separator />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <SignedIn>
                    <NavUser />
                </SignedIn>
                <SignedOut>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <div className="flex w-full">
                                <SignInButton mode="modal">
                                    <Button className="w-full" >
                                        <LogIn className="h-4 w-4" />
                                        <span className="group-data-[collapsible=icon]:hidden">Sign In / Sign Up</span>
                                    </Button>
                                </SignInButton>
                            </div>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SignedOut>
            </SidebarFooter>
        </Sidebar>
    )
}