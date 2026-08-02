"use client"

import * as React from "react"
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
import { deleteCage } from "@/app/cagecards/actions"
import type { CageCardData } from "@/app/cagecards/types"

export function DeleteCageDialog({
  open,
  onOpenChange,
  cage,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cage: CageCardData | null
  onDeleted: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) setError(null)
  }, [open])

  function handleConfirm() {
    if (!cage) return
    startTransition(async () => {
      const result = await deleteCage(cage.id)
      if (result.success) {
        onDeleted()
        onOpenChange(false)
      } else {
        // Most common case here: the cage still has active occupants — the
        // server enforces that, so surface it rather than failing silently.
        setError(result.error ?? "Something went wrong.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this cage?</AlertDialogTitle>
          <AlertDialogDescription>
            {cage ? `This permanently removes ${cage.label} and cannot be undone.` : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
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
