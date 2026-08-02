import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AlertTriangle } from "lucide-react"

import { getScheduleForTable, getScheduleFormOptions, getScheduleAnalytics } from "@/lib/schedule-data-fetcher"
import { ScheduleClient } from "@/components/schedule/schedule-client"

export default async function Page() {
  let data: Awaited<ReturnType<typeof getScheduleForTable>> = []
  let options: Awaited<ReturnType<typeof getScheduleFormOptions>> = { rabbits: [] }
  let analytics: Awaited<ReturnType<typeof getScheduleAnalytics>> = {
    totalPending: 0,
    overdueCount: 0,
    dueTodayCount: 0,
    dueThisWeekCount: 0,
    completedThisMonthCount: 0,
    completionRatePct: 100,
    byType: [],
  }
  let error: string | null = null

  try {
    ;[data, options, analytics] = await Promise.all([
      getScheduleForTable(),
      getScheduleFormOptions(),
      getScheduleAnalytics(),
    ])
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
            <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
            <p className="text-sm text-muted-foreground">
              Every upcoming and past task on your farm — search, filter, and plan from the list or the calendar.
            </p>
          </div>

          {error ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-red-300 bg-red-50 p-10 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <ScheduleClient initialData={data} options={options} analytics={analytics} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
