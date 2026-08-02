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
import { deleteSchedule } from "@/app/schedule/actions"
import type { ScheduleTableData } from "@/app/schedule/types"

export function DeleteScheduleDialog({
  open,
  onOpenChange,
  schedule,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: ScheduleTableData | null
  onDeleted: () => void
}) {
  const [pending, setPending] = React.useState(false)

  async function handleDelete() {
    if (!schedule) return
    setPending(true)
    const result = await deleteSchedule(schedule.id)
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
          <AlertDialogTitle>Delete "{schedule?.title}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the task. If it's a recurring task, future occurrences already
            created will not be affected, but no new ones will be generated from this one.
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
