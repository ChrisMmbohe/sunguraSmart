import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AlertTriangle } from "lucide-react"

import {
  getFinanceTransactions,
  getFinanceFormOptions,
  getFinanceAnalytics,
  getFinanceCurrency,
} from "@/lib/finances-data-fetcher"
import { FinancesClient } from "@/components/finances/finances-client"

export default async function Page() {
  let data: Awaited<ReturnType<typeof getFinanceTransactions>> = []
  let options: Awaited<ReturnType<typeof getFinanceFormOptions>> = { rabbits: [], feedTypes: [] }
  let analytics: Awaited<ReturnType<typeof getFinanceAnalytics>> = {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMarginPct: 0,
    transactionCountThisMonth: 0,
    monthlyTrend: [],
    revenueByItemType: [],
    expensesByCategory: [],
  }
  let currency = "KES"
  let error: string | null = null

  try {
    ;[data, options, analytics, currency] = await Promise.all([
      getFinanceTransactions(),
      getFinanceFormOptions(),
      getFinanceAnalytics(),
      getFinanceCurrency(),
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
            <h1 className="text-2xl font-semibold tracking-tight">Finances</h1>
            <p className="text-sm text-muted-foreground">
              Every sale and expense on your farm in one ledger — search, filter, and track profit from the
              list or the calendar.
            </p>
          </div>

          {error ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-red-300 bg-red-50 p-10 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <FinancesClient initialData={data} options={options} analytics={analytics} currency={currency} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
