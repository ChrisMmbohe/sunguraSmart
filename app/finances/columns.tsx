"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { FinanceRowActions } from "@/components/finances/row-actions"
import { useCurrency } from "@/components/providers/currency-provider"
import { formatDate } from "@/lib/utils/date"
import type { FinanceTransactionData, TransactionKind } from "@/app/finances/types"

// Lets the row-actions cell call back into the page without every column
// definition needing to know about dialog state.
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onEdit: (row: TData) => void
    onDelete: (row: TData) => void
  }
}

const kindStyles: Record<TransactionKind, string> = {
  sale: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  expense: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
}

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Small cell component so it can use the currency context hook. */
function AmountCell({ row }: { row: FinanceTransactionData }) {
  const { format } = useCurrency()
  return (
    <span className={row.kind === "sale" ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-red-700 dark:text-red-400"}>
      {row.kind === "sale" ? "+" : "−"}
      {format(row.amount)}
    </span>
  )
}

export const columns: ColumnDef<FinanceTransactionData>[] = [
  {
    accessorKey: "kind",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kind" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className={`gap-1 ${kindStyles[row.original.kind]}`}>
        {row.original.kind === "sale" ? (
          <ArrowUpCircle className="h-3 w-3" />
        ) : (
          <ArrowDownCircle className="h-3 w-3" />
        )}
        {row.original.kind === "sale" ? "Sale" : "Expense"}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.kind),
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "counterparty",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Party" />,
    cell: ({ row, table }) => (
      <button
        type="button"
        onClick={() => table.options.meta?.onEdit(row.original)}
        className="text-left hover:underline"
      >
        <div className="font-medium">{row.original.counterparty}</div>
        {row.original.itemCount !== undefined && (
          <div className="text-xs text-muted-foreground">
            {row.original.itemCount} item{row.original.itemCount === 1 ? "" : "s"}
          </div>
        )}
      </button>
    ),
  },
  {
    accessorKey: "typeLabel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    filterFn: (row, id, value: string[]) => value.includes(row.original.typeLabel),
  },
  {
    accessorKey: "paymentMethod",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Payment" />,
    cell: ({ row }) => <span className="capitalize">{toTitleCase(row.original.paymentMethod)}</span>,
    filterFn: (row, id, value: string[]) => value.includes(row.original.paymentMethod),
  },
  {
    accessorKey: "relatedRabbitLabel",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rabbit" />,
    cell: ({ row }) => row.original.relatedRabbitLabel ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => <AmountCell row={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row, table }) => <FinanceRowActions row={row} table={table} />,
    enableSorting: false,
    enableHiding: false,
  },
]
