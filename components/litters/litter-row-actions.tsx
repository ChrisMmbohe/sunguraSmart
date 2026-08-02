"use client";

import type { Row, Table } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Skull, Baby, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LitterTableData } from "@/app/litters/types";

interface LitterRowActionsProps {
  row: Row<LitterTableData>;
  table: Table<LitterTableData>;
}

/** Row-level actions menu for the Litters table. Mirrors components/rabbits/row-actions.tsx. */
export function LitterRowActions({ row, table }: LitterRowActionsProps) {
  const litter = row.original;
  const meta = table.options.meta;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => meta?.onEdit(litter)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit litter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => meta?.onLogMortality(litter)}>
          <Skull className="mr-2 h-4 w-4" />
          Log mortality
        </DropdownMenuItem>
        {litter.status === "active" && (
          <DropdownMenuItem onClick={() => meta?.onRecordWeaning(litter)}>
            <Baby className="mr-2 h-4 w-4" />
            Record weaning
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => meta?.onDelete(litter)} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
