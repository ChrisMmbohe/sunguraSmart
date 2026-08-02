"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { FeedTypeRowActions } from "@/components/feeds/feed-type-row-actions"
import { useCurrency } from "@/components/providers/currency-provider"
import type { FeedTypeRowData } from "@/app/feeds/types"

// TableMeta<TData> is augmented once in `columns.tsx` (imported alongside
// this file wherever the feeds page renders both tables) — no need to
// redeclare it here.

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Small cell component so it can use the currency context hook. */
function StockValueCell({ row }: { row: FeedTypeRowData }) {
  const { format } = useCurrency()
  if (!row.costPerUnit) return <span className="text-muted-foreground">—</span>
  return <span className="font-medium">{format(row.stockValue)}</span>
}

export const feedTypeColumns: ColumnDef<FeedTypeRowData>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row, table }) => (
      <button
        type="button"
        onClick={() => table.options.meta?.onEditFeedType?.(row.original)}
        className="flex items-center gap-1.5 text-left font-medium hover:underline"
      >
        {row.original.isLowStock && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
        {row.original.name}
      </button>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => toTitleCase(row.original.category),
    filterFn: (row, id, value: string[]) => value.includes(row.original.category),
  },
  {
    accessorKey: "stockOnHand",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stock on hand" />,
    cell: ({ row }) => (
      <span
        className={
          row.original.isLowStock ? "font-semibold text-amber-700 dark:text-amber-400" : "tabular-nums"
        }
      >
        {row.original.stockOnHand} {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "reorderThreshold",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reorder at" />,
    cell: ({ row }) => (
      <span className="tabular-nums text-muted-foreground">
        {row.original.reorderThreshold} {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "daysOfStockRemaining",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Est. days left" />,
    cell: ({ row }) =>
      row.original.daysOfStockRemaining === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className={row.original.daysOfStockRemaining <= 7 ? "font-medium text-red-600" : ""}>
          {row.original.daysOfStockRemaining}d
        </span>
      ),
  },
  {
    accessorKey: "stockValue",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Stock value" />,
    cell: ({ row }) => <StockValueCell row={row.original} />,
  },
  {
    accessorKey: "isLowStock",
    header: "Status",
    cell: ({ row }) =>
      row.original.isLowStock ? (
        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Low stock
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          OK
        </Badge>
      ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.isLowStock ? "low" : "ok"),
  },
  {
    id: "actions",
    cell: ({ row, table }) => <FeedTypeRowActions row={row} table={table} />,
    enableSorting: false,
    enableHiding: false,
  },
]
