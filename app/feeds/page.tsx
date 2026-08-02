import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AlertTriangle } from "lucide-react"

import {
  getFeedLogs,
  getFeedTypes,
  getFeedFormOptions,
  getFeedAnalytics,
  getFeedCurrency,
} from "@/lib/feeds-data-fetcher"
import { FeedsClient } from "@/components/feeds/feeds-client"

export default async function Page() {
  let logs: Awaited<ReturnType<typeof getFeedLogs>> = []
  let feedTypes: Awaited<ReturnType<typeof getFeedTypes>> = []
  let options: Awaited<ReturnType<typeof getFeedFormOptions>> = { feedTypes: [], cages: [] }
  let analytics: Awaited<ReturnType<typeof getFeedAnalytics>> = {
    totalFeedTypes: 0,
    lowStockCount: 0,
    totalStockValue: 0,
    logsThisMonth: 0,
    feedEfficiency: { pelletsGramsPerRabbitPerDay: 0, activeRabbitCount: 0, totalPelletsConsumedKg: 0 },
    pelletsConsumptionTrend: [],
    feedSpendTrend: [],
    consumptionByCategory: [],
    lowStockItems: [],
  }
  let currency = "KES"
  let error: string | null = null

  try {
    ;[logs, feedTypes, options, analytics, currency] = await Promise.all([
      getFeedLogs(),
      getFeedTypes(),
      getFeedFormOptions(),
      getFeedAnalytics(),
      getFeedCurrency(),
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
            <h1 className="text-2xl font-semibold tracking-tight">Feeds</h1>
            <p className="text-sm text-muted-foreground">
              Track feed inventory and every restock or consumption entry — search, filter, and watch stock
              levels, burn-down, and cost from one place.
            </p>
          </div>

          {error ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-red-300 bg-red-50 p-10 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <FeedsClient
              initialLogs={logs}
              initialFeedTypes={feedTypes}
              options={options}
              analytics={analytics}
              currency={currency}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
