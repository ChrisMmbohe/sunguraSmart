"use client"

import type { Row, Table } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { FeedTypeRowData } from "@/app/feeds/types"

export function FeedTypeRowActions({
  row,
  table,
}: {
  row: Row<FeedTypeRowData>
  table: Table<FeedTypeRowData>
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
        <DropdownMenuItem onClick={() => meta?.onEditFeedType?.(item)}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => meta?.onDeleteFeedType?.(item)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
