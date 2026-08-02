"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { ScheduleRowActions } from "@/components/schedule/row-actions"
import { ScheduleStatus } from "@/types/enums"
import { formatDate } from "@/lib/utils/date"
import type { ScheduleTableData, ScheduleUrgency } from "@/app/schedule/types"

// Lets the row-actions cell (and calendar) call back into the page without
// every column definition needing to know about dialog state.
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onEdit: (row: TData) => void
    onComplete: (row: ScheduleTableData) => void
    onMissed: (row: ScheduleTableData) => void
    onCancel: (row: ScheduleTableData) => void
    onReopen: (row: ScheduleTableData) => void
    onDelete: (row: TData) => void
  }
}

const urgencyStyles: Record<ScheduleUrgency, string> = {
  Overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  "Due today": "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  "Due this week": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Missed: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  Cancelled: "bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500",
}

const statusStyles: Record<ScheduleStatus, string> = {
  [ScheduleStatus.PENDING]: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  [ScheduleStatus.COMPLETED]: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  [ScheduleStatus.MISSED]: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  [ScheduleStatus.CANCELLED]: "bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-500",
}

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export const columns: ColumnDef<ScheduleTableData>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
    cell: ({ row, table }) => (
      <button
        type="button"
        onClick={() => table.options.meta?.onEdit(row.original)}
        className="text-left hover:underline"
      >
        <div className="font-medium">{row.original.title}</div>
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
    accessorKey: "rabbitLabel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rabbit" />,
    cell: ({ row }) =>
      row.original.rabbitLabel ?? <span className="text-muted-foreground">Farm-wide</span>,
    filterFn: (row, id, value: string[]) =>
      value.includes(row.original.rabbitLabel ?? "__farm_wide__"),
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
    cell: ({ row }) => (
      <span className={row.original.isOverdue ? "font-medium text-red-600 dark:text-red-400" : undefined}>
        {formatDate(row.original.dueDate)}
      </span>
    ),
  },
  {
    accessorKey: "urgency",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Urgency" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className={urgencyStyles[row.original.urgency]}>
        {row.original.urgency}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.urgency),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className={statusStyles[row.original.status]}>
        {toTitleCase(row.original.status)}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.status),
  },
  {
    accessorKey: "recurrenceLabel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Repeats" />,
    filterFn: (row, id, value: string[]) => value.includes(row.original.recurrenceFrequency),
  },
  {
    id: "actions",
    cell: ({ row, table }) => <ScheduleRowActions row={row} table={table} />,
    enableSorting: false,
    enableHiding: false,
  },
]
