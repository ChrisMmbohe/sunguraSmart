"use client"

import * as React from "react"
import type { Table } from "@tanstack/react-table"
import { X, SlidersHorizontal } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTableViewOptions } from "./data-table-view-options"

export interface FacetedFilterConfig {
  columnId: string
  title: string
  options: { label: string; value: string }[]
  /**
   * "primary" (default) renders inline in the toolbar at all times.
   * "secondary" is tucked into a "More filters" popover instead, so pages
   * with many facets (5+) don't overflow the toolbar on desktop. Existing
   * callers that don't set this keep their current all-inline layout.
   */
  priority?: "primary" | "secondary"
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  facets?: FacetedFilterConfig[]
  actions?: React.ReactNode
}

function isFacetActive<TData>(table: Table<TData>, columnId: string): boolean {
  const value = table.getColumn(columnId)?.getFilterValue()
  return Array.isArray(value) ? value.length > 0 : Boolean(value)
}

export function DataTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  facets = [],
  actions,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || searchValue.length > 0

  const primaryFacets = facets.filter((f) => (f.priority ?? "primary") === "primary")
  const secondaryFacets = facets.filter((f) => f.priority === "secondary")
  const activeSecondaryCount = secondaryFacets.filter((f) => isFacetActive(table, f.columnId)).length

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          className="h-8 w-full sm:w-[260px]"
        />
        {primaryFacets.map((facet) => (
          <DataTableFacetedFilter
            key={facet.columnId}
            column={table.getColumn(facet.columnId)}
            title={facet.title}
            options={facet.options}
          />
        ))}

        {secondaryFacets.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed">
                <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
                More filters
                {activeSecondaryCount > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-sm px-1.5 font-normal">
                    {activeSecondaryCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2">
              <div className="flex flex-col gap-1.5">
                <p className="px-1 text-xs font-medium text-muted-foreground">More filters</p>
                {secondaryFacets.map((facet) => (
                  <DataTableFacetedFilter
                    key={facet.columnId}
                    column={table.getColumn(facet.columnId)}
                    title={facet.title}
                    options={facet.options}
                    className="w-full justify-start"
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 lg:px-3"
            onClick={() => {
              table.resetColumnFilters()
              onSearchChange("")
            }}
          >
            Reset
            <X className="ml-2 h-3.5 w-3.5" />
          </Button>
        )}
        <DataTableViewOptions table={table} />
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
