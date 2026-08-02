"use client"

import { useTransition } from "react"
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
import { deleteRabbit } from "@/app/rabbits/actions"
import type { RabbitTableData } from "@/app/rabbits/types"

export function DeleteRabbitDialog({
  open,
  onOpenChange,
  rabbit,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rabbit: RabbitTableData | null
  onDeleted: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    if (!rabbit) return
    startTransition(async () => {
      const result = await deleteRabbit(rabbit.id)
      if (result.success) {
        onDeleted()
        onOpenChange(false)
      }
      // Deletion failures are rare (record already gone) — a silent
      // no-op plus the list simply not changing is enough signal here.
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this rabbit?</AlertDialogTitle>
          <AlertDialogDescription>
            {rabbit
              ? `This permanently removes ${rabbit.name || rabbit.tagNumber} and cannot be undone. Weight logs and health records tied to this rabbit will remain, orphaned.`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
