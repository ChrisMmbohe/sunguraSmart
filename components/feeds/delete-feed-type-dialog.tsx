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
import { deleteFeedType } from "@/app/feeds/actions"
import type { FeedTypeRowData } from "@/app/feeds/types"

export function DeleteFeedTypeDialog({
  open,
  onOpenChange,
  feedType,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedType: FeedTypeRowData | null
  onDeleted: () => void
}) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleDelete() {
    if (!feedType) return
    setPending(true)
    setError(null)
    const result = await deleteFeedType(feedType.id)
    setPending(false)
    if (result.success) {
      onOpenChange(false)
      onDeleted()
    } else {
      setError(result.error ?? "Something went wrong.")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {feedType?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the feed type and its inventory record. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-red-600">{error}</p>}
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
