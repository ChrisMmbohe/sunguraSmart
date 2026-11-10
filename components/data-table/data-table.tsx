"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type TableMeta,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableToolbar, type FacetedFilterConfig } from "./data-table-toolbar"
import { DataTablePagination } from "./data-table-pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Row fields checked against the search box, in addition to tanstack's default. */
  searchableRowAsString: (row: TData) => string
  searchPlaceholder?: string
  facets?: FacetedFilterConfig[]
  toolbarActions?: React.ReactNode
  emptyMessage?: string
  /** Passed straight through to useReactTable's `meta` — lets cell renderers
   *  (e.g. a row-actions dropdown) call back into page-level state (open a
   *  dialog, delete a row) without column defs needing to own that state. */
  meta?: Partial<TableMeta<TData>>
  /** Fires whenever the filtered row set changes (search, facets, or the
   *  underlying data itself) — lets a summary stats bar above the table
   *  stay in sync with whatever the user is currently looking at. */
  onFilteredRowsChange?: (rows: TData[]) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchableRowAsString,
  searchPlaceholder,
  facets,
  toolbarActions,
  emptyMessage = "No results.",
  meta,
  onFilteredRowsChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    meta: meta as TableMeta<TData> | undefined,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    // Search box matches against a flattened string of every field we care
    // about (tag number, name, breed, color, markings, source farm, notes…)
    // rather than just the currently-visible cell text.
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const haystack = searchableRowAsString(row.original).toLowerCase()
      return haystack.includes(filterValue.toLowerCase())
    },
    initialState: { pagination: { pageSize: 20 } },
  })

  const filteredRows = table.getFilteredRowModel().rows
  React.useEffect(() => {
    onFilteredRowsChange?.(filteredRows.map((r) => r.original))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRows])

  return (
    <div className="flex flex-col gap-4 ">
      <div className="shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300">
      <DataTableToolbar
        table={table}
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        searchPlaceholder={searchPlaceholder}
        facets={facets}
        actions={toolbarActions}
      />
      </div>
      <div className="rounded-md shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300 border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
