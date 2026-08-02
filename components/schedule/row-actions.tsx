"use client"

import type { Row, Table } from "@tanstack/react-table"
import { MoreHorizontal, CheckCircle2, XCircle, Ban, RotateCcw, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScheduleStatus } from "@/types/enums"
import type { ScheduleTableData } from "@/app/schedule/types"

export function ScheduleRowActions({
  row,
  table,
}: {
  row: Row<ScheduleTableData>
  table: Table<ScheduleTableData>
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

        {item.status === ScheduleStatus.PENDING && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onComplete(item)}>
              <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-emerald-600" />
              Mark completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.onMissed(item)}>
              <XCircle className="mr-2 h-3.5 w-3.5 text-amber-600" />
              Mark missed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.onCancel(item)}>
              <Ban className="mr-2 h-3.5 w-3.5 text-neutral-500" />
              Cancel
            </DropdownMenuItem>
          </>
        )}

        {(item.status === ScheduleStatus.MISSED || item.status === ScheduleStatus.CANCELLED) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onReopen(item)}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Reopen as pending
            </DropdownMenuItem>
          </>
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
