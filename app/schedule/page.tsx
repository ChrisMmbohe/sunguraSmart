import { AppSidebar } from "@/components/app-sidebar"
import { SidebarRight } from "@/components/sidebar-right"
import { SiteHeader } from "@/components/site-header"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl" />
          <div className="bg-muted/50 mx-auto h-screen w-full max-w-3xl rounded-xl" />
        </div>
      </SidebarInset>
      <SidebarRight />
    </SidebarProvider>
  )
}
