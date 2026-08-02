"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { HealthRowActions } from "@/components/health/row-actions"
import { HealthRecordOutcome } from "@/types/enums"
import { formatDate } from "@/lib/utils/date"
import type { HealthRecordTableData, FollowUpUrgency } from "@/app/health/types"

// Same undefined-locale hydration risk as dates: Number.toLocaleString()
// with no locale arg defers to the runtime default too.
const costFormatter = new Intl.NumberFormat("en-KE")

// Lets the row-actions cell call back into the page without every column
// definition needing to know about dialog state.
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onEdit: (row: TData) => void
    onSetOutcome: (row: HealthRecordTableData, outcome: HealthRecordOutcome) => void
    onDelete: (row: TData) => void
    
    
  }
}

const outcomeStyles: Record<HealthRecordOutcome, string> = {
  [HealthRecordOutcome.ONGOING]: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  [HealthRecordOutcome.RECOVERED]: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  [HealthRecordOutcome.DECEASED]: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  [HealthRecordOutcome.CHRONIC]: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
}

const urgencyStyles: Record<FollowUpUrgency, string> = {
  Overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  "Due today": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  "Due this week": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  "No follow-up": "bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
}

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export const columns: ColumnDef<HealthRecordTableData>[] = [
  {
    accessorKey: "rabbitLabel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rabbit" />,
    cell: ({ row, table }) => (
      <button
        type="button"
        onClick={() => table.options.meta?.onEdit(row.original)}
        className="text-left hover:underline"
      >
        <div className="font-medium">{row.original.rabbitLabel}</div>
        <div className="text-xs text-muted-foreground">{toTitleCase(row.original.type)}</div>
      </button>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <span className="capitalize">{toTitleCase(row.original.type)}</span>,
    filterFn: (row, id, value: string[]) => value.includes(row.original.type),
  },
  {
    accessorKey: "diseaseName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Disease" />,
    cell: ({ row }) =>
      row.original.diseaseName ? (
        <span className="inline-flex items-center gap-1">
          {row.original.diseaseName}
          {row.original.diseaseContagious && (
            <AlertTriangle className="h-3 w-3 text-red-500" aria-label="Contagious" />
          )}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.diseaseName ?? "__none__"),
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "outcome",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Outcome" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className={outcomeStyles[row.original.outcome]}>
        {toTitleCase(row.original.outcome)}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.outcome),
  },
  {
    accessorKey: "followUpUrgency",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Follow-up" />,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <Badge variant="secondary" className={urgencyStyles[row.original.followUpUrgency]}>
          {row.original.followUpUrgency}
        </Badge>
        {row.original.followUpDate && (
          <span className="text-[11px] text-muted-foreground">{formatDate(row.original.followUpDate)}</span>
        )}
      </div>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.followUpUrgency),
  },
  {
    accessorKey: "cost",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cost" />,
    cell: ({ row }) => (row.original.cost !== undefined ? costFormatter.format(row.original.cost) : "—"),
  },
  {
    id: "actions",
    cell: ({ row, table }) => <HealthRowActions row={row} table={table} />,
    enableSorting: false,
    enableHiding: false,
  },
]
