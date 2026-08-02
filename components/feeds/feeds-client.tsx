"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, PackagePlus, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table/data-table"
import { feedLogColumns } from "@/app/feeds/columns"
import { feedTypeColumns } from "@/app/feeds/feedtype-columns"
import { FeedLogFormDialog } from "@/components/feeds/feed-log-form-dialog"
import { FeedTypeFormDialog } from "@/components/feeds/feed-type-form-dialog"
import { DeleteFeedLogDialog } from "@/components/feeds/delete-feed-log-dialog"
import { DeleteFeedTypeDialog } from "@/components/feeds/delete-feed-type-dialog"
import { FeedsSummaryStats } from "@/components/feeds/feeds-summary-stats"
import { CurrencyProvider } from "@/components/providers/currency-provider"
import { FeedCategory } from "@/types/enums"
import type {
  FeedLogRowData,
  FeedTypeRowData,
  FeedFormOptions,
  FeedAnalyticsSummary,
  FeedLogDirection,
} from "@/app/feeds/types"
import type { FacetedFilterConfig } from "@/components/data-table/data-table-toolbar"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function FeedsClient({
  initialLogs,
  initialFeedTypes,
  options,
  analytics,
  currency,
}: {
  initialLogs: FeedLogRowData[]
  initialFeedTypes: FeedTypeRowData[]
  options: FeedFormOptions
  analytics: FeedAnalyticsSummary
  currency: string
}) {
  const router = useRouter()

  const [logFormOpen, setLogFormOpen] = React.useState(false)
  const [editingLog, setEditingLog] = React.useState<FeedLogRowData | null>(null)
  const [logDefaultDirection, setLogDefaultDirection] = React.useState<FeedLogDirection>("restock")

  const [feedTypeFormOpen, setFeedTypeFormOpen] = React.useState(false)
  const [editingFeedType, setEditingFeedType] = React.useState<FeedTypeRowData | null>(null)

  const [deleteLogOpen, setDeleteLogOpen] = React.useState(false)
  const [deleteLogTarget, setDeleteLogTarget] = React.useState<FeedLogRowData | null>(null)

  const [deleteFeedTypeOpen, setDeleteFeedTypeOpen] = React.useState(false)
  const [deleteFeedTypeTarget, setDeleteFeedTypeTarget] = React.useState<FeedTypeRowData | null>(null)

  function refresh() {
    router.refresh()
  }

  function openCreateLog(direction: FeedLogDirection) {
    setEditingLog(null)
    setLogDefaultDirection(direction)
    setLogFormOpen(true)
  }

  function openEditLog(row: FeedLogRowData) {
    setEditingLog(row)
    setLogDefaultDirection(row.direction)
    setLogFormOpen(true)
  }

  function openCreateFeedType() {
    setEditingFeedType(null)
    setFeedTypeFormOpen(true)
  }

  function openEditFeedType(row: FeedTypeRowData) {
    setEditingFeedType(row)
    setFeedTypeFormOpen(true)
  }

  const logCategoryFacetOptions = React.useMemo(() => {
    const labels = new Set<string>()
    for (const log of initialLogs) labels.add(log.category)
    return Array.from(labels)
      .sort()
      .map((c) => ({ label: toTitleCase(c), value: c }))
  }, [initialLogs])

  const logFacets: FacetedFilterConfig[] = React.useMemo(
    () => [
      {
        columnId: "direction",
        title: "Direction",
        options: [
          { label: "Restock", value: "restock" },
          { label: "Consumption", value: "consumption" },
        ],
      },
      { columnId: "category", title: "Category", options: logCategoryFacetOptions },
    ],
    [logCategoryFacetOptions]
  )

  const feedTypeFacets: FacetedFilterConfig[] = React.useMemo(
    () => [
      {
        columnId: "category",
        title: "Category",
        options: Object.values(FeedCategory).map((c) => ({ label: toTitleCase(c), value: c })),
      },
      {
        columnId: "isLowStock",
        title: "Status",
        options: [
          { label: "Low stock", value: "low" },
          { label: "OK", value: "ok" },
        ],
      },
    ],
    []
  )

  return (
    <CurrencyProvider currency={currency}>
      <FeedsSummaryStats analytics={analytics} />

      {analytics.lowStockItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="text-sm">
            <span className="font-medium">
              {analytics.lowStockItems.length} feed type{analytics.lowStockItems.length === 1 ? "" : "s"} at or
              below reorder level:
            </span>{" "}
            {analytics.lowStockItems.map((i) => `${i.name} (${i.stockOnHand} ${i.unit})`).join(", ")}
          </div>
        </div>
      )}

      <Tabs defaultValue="inventory" className="gap-4">
        <div className="flex items-center justify-between">
          <TabsList className="rounded-xl bg-muted/50 hover:shadow-lg transition-shadow duration-300 border-1 border-border shadow-2xl dark:shadow-muted">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="log">Log</TabsTrigger>
          </TabsList>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openCreateFeedType}>
                <PackagePlus className="mr-2 h-3.5 w-3.5 text-blue-600" />
                New feed type
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateLog("restock")}>
                <ArrowUpCircle className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                Log a restock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openCreateLog("consumption")}>
                <ArrowDownCircle className="mr-2 h-3.5 w-3.5 text-amber-600" />
                Log consumption
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="inventory">
          <DataTable
            columns={feedTypeColumns}
            data={initialFeedTypes}
            searchPlaceholder="Search feed types…"
            searchableRowAsString={(r) => [r.name, r.category, r.unit].filter(Boolean).join(" ")}
            facets={feedTypeFacets}
            emptyMessage="No feed types yet — add your first one to start tracking stock."
            meta={{
              onEditFeedType: openEditFeedType,
              onDeleteFeedType: (row) => {
                setDeleteFeedTypeTarget(row)
                setDeleteFeedTypeOpen(true)
              },
            }}
          />
        </TabsContent>

        <TabsContent value="log">
          <DataTable
            columns={feedLogColumns}
            data={initialLogs}
            searchPlaceholder="Search feed type, category, cage, notes…"
            searchableRowAsString={(r) =>
              [r.feedTypeLabel, r.category, r.cageLabel, r.notes, r.direction].filter(Boolean).join(" ")
            }
            facets={logFacets}
            emptyMessage="No feed logs yet — record a restock or consumption entry to get started."
            meta={{
              onEditLog: openEditLog,
              onDeleteLog: (row) => {
                setDeleteLogTarget(row)
                setDeleteLogOpen(true)
              },
            }}
          />
        </TabsContent>
      </Tabs>

      <FeedLogFormDialog
        open={logFormOpen}
        onOpenChange={setLogFormOpen}
        options={options}
        log={editingLog}
        defaultDirection={logDefaultDirection}
        onSaved={refresh}
      />

      <FeedTypeFormDialog
        open={feedTypeFormOpen}
        onOpenChange={setFeedTypeFormOpen}
        feedType={editingFeedType}
        onSaved={refresh}
      />

      <DeleteFeedLogDialog
        open={deleteLogOpen}
        onOpenChange={setDeleteLogOpen}
        log={deleteLogTarget}
        onDeleted={refresh}
      />

      <DeleteFeedTypeDialog
        open={deleteFeedTypeOpen}
        onOpenChange={setDeleteFeedTypeOpen}
        feedType={deleteFeedTypeTarget}
        onDeleted={refresh}
      />
    </CurrencyProvider>
  )
}
