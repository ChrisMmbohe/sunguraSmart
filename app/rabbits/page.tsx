import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AlertTriangle } from "lucide-react"

import { getRabbitsForTable, getRabbitFormOptions } from "@/lib/data-fetcher"
import { RabbitsClient } from "@/components/rabbits/rabbits-client"

export default async function Page() {
  let data: Awaited<ReturnType<typeof getRabbitsForTable>> = []
  let options: Awaited<ReturnType<typeof getRabbitFormOptions>> = {
    breeds: [],
    cages: [],
    bucks: [],
    does: [],
  }
  let error: string | null = null

  try {
    ;[data, options] = await Promise.all([getRabbitsForTable(), getRabbitFormOptions()])
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rabbits</h1>
            <p className="text-sm text-muted-foreground">
              Every rabbit on your farm — search, filter, and manage records here.
            </p>
          </div>

          {error ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-red-300 bg-red-50 p-10 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <RabbitsClient initialData={data} options={options} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
