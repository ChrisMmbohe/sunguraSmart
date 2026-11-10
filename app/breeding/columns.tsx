"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { RowActions } from "@/components/breeding/row-actions";
import { BreedingStatus } from "@/types/enums";
import type { BreedingTableData } from "./types";

declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onUpdateStatus: (row: TData) => void;
    onEdit: (row: TData) => void;
    onDelete: (row: TData) => void;
  }
}

const statusStyles: Record<BreedingStatus, string> = {
  [BreedingStatus.PLANNED]: "bg-slate-100 text-slate-700",
  [BreedingStatus.PAIRED]: "bg-blue-100 text-blue-700",
  [BreedingStatus.CONFIRMED_PREGNANT]: "bg-emerald-100 text-emerald-700",
  [BreedingStatus.FAILED]: "bg-red-100 text-red-700",
  [BreedingStatus.KINDLED]: "bg-violet-100 text-violet-700",
  [BreedingStatus.WEANED]: "bg-amber-100 text-amber-700",
  [BreedingStatus.ABORTED]: "bg-orange-100 text-orange-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export const columns: ColumnDef<BreedingTableData>[] = [
  {
    id: "pair",
    accessorKey: "doeName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Pair" />,
    cell: ({ row }) => <div><div className="font-medium">{row.original.doeName} x {row.original.buckName}</div><div className="text-xs text-muted-foreground">#{row.original.doeTagNumber} x #{row.original.buckTagNumber}</div></div>,
  },
  { accessorKey: "pairedDate", header: ({ column }) => <DataTableColumnHeader column={column} title="Mated" />, cell: ({ row }) => formatDate(row.original.pairedDate) },
  {
    accessorKey: "expectedDueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
    cell: ({ row }) => <span className={row.original.isOverdue ? "font-medium text-red-600" : ""}>{formatDate(row.original.expectedDueDate)}{row.original.isOverdue ? " (overdue)" : ""}</span>,
  },
  { accessorKey: "method", header: "Method", cell: ({ row }) => <span className="capitalize">{row.original.method.replace(/_/g, " ")}</span> },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row, table }) => <button type="button" className="text-left" onClick={() => table.options.meta?.onUpdateStatus(row.original)}><Badge variant="secondary" className={statusStyles[row.original.status]}>{row.original.status.replace(/_/g, " ")}</Badge></button>,
    filterFn: (row, id, value: string[]) => value.includes(row.original.status),
  },
  { accessorKey: "failureReason", header: "Outcome", cell: ({ row }) => row.original.failureReason ?? (row.original.litterId ? "Litter recorded" : "Pending") },
  { id: "actions", cell: ({ row, table }) => <RowActions row={row.original} onEdit={() => table.options.meta?.onEdit(row.original)} onDelete={() => table.options.meta?.onDelete(row.original)} />, enableSorting: false, enableHiding: false },
];