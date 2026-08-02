"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { RowActions } from "@/components/rabbits/row-actions"
import { RabbitStatus, HealthStatus, Gender } from "@/types/enums"
import type { RabbitTableData } from "@/app/rabbits/types"

// Lets the row-actions cell call back into the page without every column
// definition needing to know about dialog state.
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onViewAnalytics: (row: RabbitTableData) => void
    onEdit: (row: TData) => void
    onLogWeight: (row: RabbitTableData) => void
    onDelete: (row: TData) => void
    onQuickStatus: (row: RabbitTableData, status: RabbitStatus) => void
  }
}

const statusStyles: Record<RabbitStatus, string> = {
  [RabbitStatus.ACTIVE]: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  [RabbitStatus.SOLD]: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  [RabbitStatus.DECEASED]: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  [RabbitStatus.RETIRED]: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  [RabbitStatus.TRANSFERRED]: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
}

const healthStyles: Record<HealthStatus, string> = {
  [HealthStatus.HEALTHY]: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  [HealthStatus.SICK]: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  [HealthStatus.RECOVERING]: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  [HealthStatus.QUARANTINED]: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  [HealthStatus.DECEASED]: "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
}

function formatAge(days?: number): string {
  if (days === undefined) return "—"
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}mo`
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  return months > 0 ? `${years}y ${months}mo` : `${years}y`
}

export const columns: ColumnDef<RabbitTableData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value: boolean | "indeterminate") => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean | "indeterminate") => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "tagNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rabbit" />,
    cell: ({ row, table }) => (
      <button
        type="button"
        onClick={() => table.options.meta?.onViewAnalytics(row.original)}
        className="text-left hover:underline"
      >
        <div className="font-medium">{row.original.name || row.original.tagNumber}</div>
        {row.original.name && (
          <div className="text-xs text-muted-foreground">#{row.original.tagNumber}</div>
        )}
      </button>
    ),
  },
  {
    accessorKey: "breedName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Breed" />,
    filterFn: (row, id, value: string[]) => value.includes(row.original.breedId),
  },
  {
    accessorKey: "gender",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gender" />,
    cell: ({ row }) => (row.original.gender === Gender.MALE ? "Buck" : "Doe"),
    filterFn: (row, id, value: string[]) => value.includes(row.original.gender),
  },
  {
    accessorKey: "ageDays",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
    cell: ({ row }) => formatAge(row.original.ageDays),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className={statusStyles[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.status),
  },
  {
    accessorKey: "healthStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Health" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className={healthStyles[row.original.healthStatus]}>
        {row.original.healthStatus}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.healthStatus),
  },
  {
    accessorKey: "purpose",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Purpose" />,
    cell: ({ row }) => <span className="capitalize">{row.original.purpose.replace(/_/g, " ")}</span>,
    filterFn: (row, id, value: string[]) => value.includes(row.original.purpose),
  },
  {
    accessorKey: "cageLabel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cage" />,
    cell: ({ row }) => row.original.cageLabel ?? <span className="text-muted-foreground">Unassigned</span>,
  },
  {
    accessorKey: "currentWeightKg",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Weight" />,
    cell: ({ row }) =>
      row.original.currentWeightKg !== undefined ? `${row.original.currentWeightKg.toFixed(2)} kg` : "—",
  },
  {
    id: "actions",
    cell: ({ row, table }) => <RowActions row={row} table={table} />,
    enableSorting: false,
    enableHiding: false,
  },
]
