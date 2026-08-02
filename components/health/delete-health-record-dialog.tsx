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
import { deleteHealthRecord } from "@/app/health/actions"
import type { HealthRecordTableData } from "@/app/health/types"

export function DeleteHealthRecordDialog({
  open,
  onOpenChange,
  record,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: HealthRecordTableData | null
  onDeleted: () => void
}) {
  const [pending, setPending] = React.useState(false)

  async function handleDelete() {
    if (!record) return
    setPending(true)
    const result = await deleteHealthRecord(record.id)
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
          <AlertDialogTitle>Delete this health record?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the record for {record?.rabbitLabel}. If a follow-up Schedule task
            was auto-created from it, that task will be cancelled rather than deleted.
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
