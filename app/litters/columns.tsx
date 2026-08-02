"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { LitterRowActions } from "@/components/litters/litter-row-actions";
import { formatDate } from "@/lib/utils/date";
import type { LitterTableData } from "./types";

// Lets the row-actions cell call back into the page without every column
// definition needing to know about dialog state. Mirrors app/rabbits/columns.tsx.
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onEdit: (row: TData) => void
    onLogMortality: (row: LitterTableData) => void;
    onRecordWeaning: (row: LitterTableData) => void;
    onDelete: (row: TData) => void
  }
}

// Columns are deliberately consolidated (a primary value + a muted caption
// underneath) rather than one column per stat — this keeps the table at the
// same width as the Rabbits table instead of forcing horizontal scroll.
export const columns: ColumnDef<LitterTableData>[] = [
  {
    accessorKey: "doeName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Doe" />,
    cell: ({ row, table }) => (
      <button
        type="button"
        onClick={() => table.options.meta?.onEdit(row.original)}
        className="text-left hover:underline"
      >
        <div className="font-medium">{row.original.doeName}</div>
        {row.original.doeTagNumber && (
          <div className="text-xs text-muted-foreground">#{row.original.doeTagNumber}</div>
        )}
      </button>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.doeName),
  },
  {
    accessorKey: "buckName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Buck" />,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.buckName}</span>
        {row.original.buckTagNumber && (
          <span className="text-xs text-muted-foreground">#{row.original.buckTagNumber}</span>
        )}
      </div>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.buckName),
  },
  {
    accessorKey: "breedName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Breed" />,
    filterFn: (row, id, value: string[]) => value.includes(row.original.breedName),
  },
  {
    accessorKey: "kindleDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Kindled" />,
    cell: ({ row }) => formatDate(row.original.kindleDate),
    sortingFn: "datetime",
  },
  {
    // Combines kitsBornAlive + kitsBornDead — was two columns.
    accessorKey: "kitsBornAlive",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Born" />,
    cell: ({ row }) => (
      <div>
        <span className="tabular-nums font-medium">{row.original.kitsBornAlive}</span>
        {row.original.kitsBornDead > 0 && (
          <div className="text-xs text-muted-foreground">{row.original.kitsBornDead} stillborn</div>
        )}
      </div>
    ),
  },
  {
    // Combines kitsAlive + mortalityCount — was two columns. Keeps
    // accessorKey "mortalityCount" so the existing has_losses/no_losses
    // facet filter in litters-client.tsx keeps working unchanged.
    accessorKey: "mortalityCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Alive now" />,
    cell: ({ row }) => (
      <div>
        <span className="tabular-nums font-medium text-emerald-600">{row.original.kitsAlive}</span>
        {row.original.mortalityCount > 0 && (
          <div className="text-xs text-red-600">{row.original.mortalityCount} lost</div>
        )}
      </div>
    ),
    filterFn: (row, id, value: string[]) => {
      const bucket = row.original.hasLosses ? "has_losses" : "no_losses";
      return value.includes(bucket);
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) =>
      row.original.status === "weaned" ? (
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100">
          Weaned
        </Badge>
      ) : (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Active
        </Badge>
      ),
    filterFn: (row, id, value: string[]) => value.includes(row.original.status),
  },
  {
    // Combines kitsWeaned + survivalRatePct + weaningDate — was three columns.
    accessorKey: "kitsWeaned",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Weaned" />,
    cell: ({ row }) => {
      if (row.original.kitsWeaned == null) return <span className="text-muted-foreground">—</span>;
      const parts = [
        row.original.survivalRatePct != null ? `${row.original.survivalRatePct.toFixed(0)}% survival` : null,
        formatDate(row.original.weaningDate),
      ].filter(Boolean);
      return (
        <div>
          <span className="tabular-nums font-medium">{row.original.kitsWeaned}</span>
          {parts.length > 0 && <div className="text-xs text-muted-foreground">{parts.join(" · ")}</div>}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => <LitterRowActions row={row} table={table} />,
    enableSorting: false,
    enableHiding: false,
  },
];
