"use client"

import type { Row, Table } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, HeartPulse, Skull, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HealthRecordOutcome } from "@/types/enums"
import type { HealthRecordTableData } from "@/app/health/types"

export function HealthRowActions({
  row,
  table,
}: {
  row: Row<HealthRecordTableData>
  table: Table<HealthRecordTableData>
}) {
  const item = row.original
  const meta = table.options.meta

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => meta?.onEdit(item)}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit
        </DropdownMenuItem>

        {item.outcome !== HealthRecordOutcome.RECOVERED && (
          <DropdownMenuItem onClick={() => meta?.onSetOutcome(item, HealthRecordOutcome.RECOVERED)}>
            <HeartPulse className="mr-2 h-3.5 w-3.5 text-emerald-600" />
            Mark recovered
          </DropdownMenuItem>
        )}
        {item.outcome !== HealthRecordOutcome.CHRONIC && (
          <DropdownMenuItem onClick={() => meta?.onSetOutcome(item, HealthRecordOutcome.CHRONIC)}>
            <RefreshCcw className="mr-2 h-3.5 w-3.5 text-orange-600" />
            Mark chronic
          </DropdownMenuItem>
        )}
        {item.outcome !== HealthRecordOutcome.DECEASED && (
          <DropdownMenuItem onClick={() => meta?.onSetOutcome(item, HealthRecordOutcome.DECEASED)}>
            <Skull className="mr-2 h-3.5 w-3.5 text-neutral-600" />
            Mark deceased
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => meta?.onDelete(item)} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
