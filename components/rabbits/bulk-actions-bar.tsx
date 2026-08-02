"use client"

import * as React from "react"
import { Trash2, Archive, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { RabbitTableData } from "@/app/rabbits/types"
import { RabbitStatus } from "@/types/enums"

/**
 * Floating bar that appears once rows are selected in the table. Gives the
 * checkboxes in `columns.tsx` an actual purpose — previously selection
 * state existed in the UI with no consumer.
 */
export function BulkActionsBar({
  selected,
  onClearSelection,
  onBulkRetire,
  onBulkDelete,
}: {
  selected: RabbitTableData[]
  onClearSelection: () => void
  onBulkRetire: (ids: string[]) => Promise<void> | void
  onBulkDelete: (ids: string[]) => Promise<void> | void
}) {
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  if (selected.length === 0) return null

  const ids = selected.map((r) => r.id)
  const retireCount = selected.filter((r) => r.status !== RabbitStatus.RETIRED).length

  return (
    <>
      <div className="sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-2xl">
        <span className="text-sm font-medium tabular-nums">
          {selected.length} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5"
          disabled={isPending || retireCount === 0}
          onClick={() => startTransition(() => onBulkRetire(ids))}
        >
          <Archive className="h-3.5 w-3.5" />
          Retire
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
        <div className="h-4 w-px bg-border" />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClearSelection}>
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Clear selection</span>
        </Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.length} rabbits?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes all {selected.length} selected rabbits and cannot be undone. Weight logs and
              health records tied to them will remain, orphaned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                startTransition(async () => {
                  await onBulkDelete(ids)
                  setDeleteOpen(false)
                })
              }
            >
              {isPending ? "Deleting…" : "Delete all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
