"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import type { LitterTableData, BreedingOption } from "./types";

interface LittersDataTableToolbarProps {
  table: Table<LitterTableData>;
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  breedingOptions: BreedingOption[];
}

export function LittersDataTableToolbar({
  table,
  globalFilter,
  onGlobalFilterChange,
  breedingOptions,
}: LittersDataTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0;

  const rows = table.getPreFilteredRowModel().rows.map((r) => r.original);
  const uniq = (values: (string | undefined)[]) =>
    Array.from(new Set(values.filter((v): v is string => !!v))).sort();

  const breedOptions = uniq(rows.map((r) => r.breedName)).map((v) => ({ label: v, value: v }));
  const doeOptions = uniq(rows.map((r) => r.doeName)).map((v) => ({ label: v, value: v }));
  const buckOptions = uniq(rows.map((r) => r.buckName)).map((v) => ({ label: v, value: v }));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Search doe, buck, breed, notes..."
          value={globalFilter}
          onChange={(e) => onGlobalFilterChange(e.target.value)}
          className="h-8 w-[220px] lg:w-[280px]"
        />

        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={[
              { label: "Active (nursing)", value: "active" },
              { label: "Weaned", value: "weaned" },
            ]}
          />
        )}

        {table.getColumn("breedName") && breedOptions.length > 0 && (
          <DataTableFacetedFilter column={table.getColumn("breedName")} title="Breed" options={breedOptions} />
        )}

        {table.getColumn("doeName") && doeOptions.length > 0 && (
          <DataTableFacetedFilter column={table.getColumn("doeName")} title="Doe" options={doeOptions} />
        )}

        {table.getColumn("buckName") && buckOptions.length > 0 && (
          <DataTableFacetedFilter column={table.getColumn("buckName")} title="Buck" options={buckOptions} />
        )}

        {table.getColumn("mortalityCount") && (
          <DataTableFacetedFilter
            column={table.getColumn("mortalityCount")}
            title="Mortality"
            options={[
              { label: "Has losses", value: "has_losses" },
              { label: "No losses", value: "no_losses" },
            ]}
          />
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              onGlobalFilterChange("");
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
