"use client";

import { useMemo, useState } from "react";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

import { columns } from "./columns";
import { LittersDataTableToolbar } from "./data-table-toolbar";
import { LittersSummaryStats } from "@/components/litters/litters-summary-stats";
import type { BreedingOption, LitterAnalyticsSummary, LitterTableData } from "./types";

interface LittersTableProps {
  data: LitterTableData[];
  breedingOptions: BreedingOption[];
  analyticsSummary: LitterAnalyticsSummary;
}

// Global search across the fields a farmer would actually type.
function globalFilterFn(row: { original: LitterTableData }, _columnId: string, filterValue: string) {
  const q = filterValue.trim().toLowerCase();
  if (!q) return true;
  const r = row.original;
  return [r.doeName, r.doeTagNumber, r.buckName, r.buckTagNumber, r.breedName, r.notes ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function LittersTable({ data, breedingOptions, analyticsSummary }: LittersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "kindleDate", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const filteredRows = useMemo(
    () => table.getFilteredRowModel().rows.map((r) => r.original),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table.getFilteredRowModel().rows, sorting, columnFilters, globalFilter]
  );

  return (
    <div className="space-y-4">
      <LittersSummaryStats filteredRows={filteredRows} serverSummary={analyticsSummary} />

      <LittersDataTableToolbar
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        breedingOptions={breedingOptions}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No litters match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
