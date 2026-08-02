"use client"

import * as React from "react"
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
import { deleteFeedLog } from "@/app/feeds/actions"
import type { FeedLogRowData } from "@/app/feeds/types"

export function DeleteFeedLogDialog({
  open,
  onOpenChange,
  log,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: FeedLogRowData | null
  onDeleted: () => void
}) {
  const [pending, setPending] = React.useState(false)

  async function handleDelete() {
    if (!log) return
    setPending(true)
    const result = await deleteFeedLog(log.id)
    setPending(false)
    if (result.success) {
      onOpenChange(false)
      onDeleted()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {log?.direction} entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the {log?.direction} of {log?.quantity} {log?.unit} of {log?.feedTypeLabel} and reverses
            its effect on stock on hand. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              void handleDelete()
            }}
            disabled={pending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
