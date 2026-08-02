"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { FeedLogRowActions } from "@/components/feeds/feed-log-row-actions"
import { useCurrency } from "@/components/providers/currency-provider"
import { formatDate } from "@/lib/utils/date"
import type { FeedLogRowData, FeedLogDirection } from "@/app/feeds/types"

// Shared across both feeds tables (log + inventory) — declared once here
// since `columns.tsx` is guaranteed to be part of the feeds page bundle.
// All members are optional so each table can pass only the meta it needs.
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onEditLog?: (row: TData) => void
    onDeleteLog?: (row: TData) => void
    onEditFeedType?: (row: TData) => void
    onDeleteFeedType?: (row: TData) => void
  }
}

const directionStyles: Record<FeedLogDirection, string> = {
  restock: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  consumption: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
}

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Small cell component so it can use the currency context hook. */
function CostCell({ row }: { row: FeedLogRowData }) {
  const { format } = useCurrency()
  if (row.costImpact === undefined) return <span className="text-muted-foreground">—</span>
  return <span className="font-medium text-red-700 dark:text-red-400">{format(row.costImpact)}</span>
}

export const feedLogColumns: ColumnDef<FeedLogRowData>[] = [
  {
    accessorKey: "direction",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Direction" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className={`gap-1 ${directionStyles[row.original.direction]}`}>
        {row.original.direction === "restock" ? (
          <ArrowUpCircle className="h-3 w-3" />
        ) : (
          <ArrowDownCircle className="h-3 w-3" />
        )}
        {row.original.direction === "restock" ? "Restock" : "Consumption"}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.direction),
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "feedTypeLabel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Feed type" />,
    cell: ({ row, table }) => (
      <button
        type="button"
        onClick={() => table.options.meta?.onEditLog?.(row.original)}
        className="text-left font-medium hover:underline"
      >
        {row.original.feedTypeLabel}
      </button>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
    cell: ({ row }) => <span>{toTitleCase(row.original.category)}</span>,
    filterFn: (row, id, value: string[]) => value.includes(row.original.category),
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.quantity} {row.original.unit}
      </span>
    ),
  },
  {
    accessorKey: "rabbitsFed",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rabbits fed" />,
    cell: ({ row }) => row.original.rabbitsFed ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "cageLabel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cage" />,
    cell: ({ row }) => row.original.cageLabel ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "costImpact",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cost" />,
    cell: ({ row }) => <CostCell row={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row, table }) => <FeedLogRowActions row={row} table={table} />,
    enableSorting: false,
    enableHiding: false,
  },
]
