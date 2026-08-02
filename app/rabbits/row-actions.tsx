"use client"

import { MoreHorizontal, Pencil, Scale, Trash2, Archive, Skull, BarChart3 } from "lucide-react"
import type { Row, Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RabbitStatus } from "@/types/enums"
import type { RabbitTableData } from "@/app/rabbits/types"

// onQuickStatus now always routes through a confirmation dialog in the
// parent (RabbitsClient) rather than firing immediately — status changes
// have real side effects (health status, deceasedDate, cage release).
export function RowActions({ row, table }: { row: Row<RabbitTableData>; table: Table<RabbitTableData> }) {
  const rabbit = row.original
  const meta = table.options.meta

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[170px]">
        <DropdownMenuItem onClick={() => meta?.onViewAnalytics(rabbit)}>
          <BarChart3 className="mr-2 h-3.5 w-3.5" />
          View analytics
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => meta?.onEdit(rabbit)}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => meta?.onLogWeight(rabbit)}>
          <Scale className="mr-2 h-3.5 w-3.5" />
          Log weight
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {rabbit.status !== RabbitStatus.RETIRED && (
          <DropdownMenuItem onClick={() => meta?.onQuickStatus(rabbit, RabbitStatus.RETIRED)}>
            <Archive className="mr-2 h-3.5 w-3.5" />
            Mark retired
          </DropdownMenuItem>
        )}
        {rabbit.status !== RabbitStatus.DECEASED && (
          <DropdownMenuItem
            onClick={() => meta?.onQuickStatus(rabbit, RabbitStatus.DECEASED)}
            className="text-destructive focus:text-destructive"
          >
            <Skull className="mr-2 h-3.5 w-3.5" />
            Mark deceased
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => meta?.onDelete(rabbit)} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
