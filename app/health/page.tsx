import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AlertTriangle } from "lucide-react"

import {
  getHealthRecordsForTable,
  getHealthFormOptions,
  getHealthAnalytics,
  getDiseasesForTable,
} from "@/lib/health-data-fetcher"
import { HealthClient } from "@/components/health/health-client"

export default async function Page() {
  let data: Awaited<ReturnType<typeof getHealthRecordsForTable>> = []
  let options: Awaited<ReturnType<typeof getHealthFormOptions>> = { rabbits: [], diseases: [] }
  let analytics: Awaited<ReturnType<typeof getHealthAnalytics>> = {
    currentlySick: 0,
    currentlyRecovering: 0,
    currentlyQuarantined: 0,
    recordsThisMonth: 0,
    overdueFollowUps: 0,
    dueThisWeekFollowUps: 0,
    costThisMonth: 0,
    outcomeBreakdown: [],
    byType: [],
    topDiseases: [],
  }
  let diseases: Awaited<ReturnType<typeof getDiseasesForTable>> = []
  let error: string | null = null

  try {
    ;[data, options, analytics, diseases] = await Promise.all([
      getHealthRecordsForTable(),
      getHealthFormOptions(),
      getHealthAnalytics(),
      getDiseasesForTable(),
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
            <h1 className="text-2xl font-semibold tracking-tight">Health</h1>
            <p className="text-sm text-muted-foreground">
              Every health record on your farm — search, filter, track follow-ups, and manage the disease
              catalog from here.
            </p>
          </div>

          {error ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-red-300 bg-red-50 p-10 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <HealthClient initialData={data} options={options} analytics={analytics} diseases={diseases} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
