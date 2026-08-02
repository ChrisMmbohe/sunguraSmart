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
import { setRabbitStatus } from "@/app/rabbits/actions"
import { RabbitStatus } from "@/types/enums"
import type { RabbitTableData } from "@/app/rabbits/types"

const STATUS_COPY: Record<
  RabbitStatus,
  { title: string; description: (name: string) => string; destructive: boolean; confirmLabel: string }
> = {
  [RabbitStatus.DECEASED]: {
    title: "Mark deceased?",
    description: (name) =>
      `${name} will be marked deceased, its health status updated, and its cage (if any) released back to the available pool. This cannot be undone from here.`,
    destructive: true,
    confirmLabel: "Mark deceased",
  },
  [RabbitStatus.SOLD]: {
    title: "Mark sold?",
    description: (name) =>
      `${name} will be marked sold and removed from the active population. Its cage, if any, will be released. This is normally handled automatically when you record a sale — use this only for manual corrections.`,
    destructive: false,
    confirmLabel: "Mark sold",
  },
  [RabbitStatus.TRANSFERRED]: {
    title: "Mark transferred?",
    description: (name) =>
      `${name} will be marked transferred off the farm and removed from the active population. Its cage, if any, will be released.`,
    destructive: false,
    confirmLabel: "Mark transferred",
  },
  [RabbitStatus.RETIRED]: {
    title: "Mark retired?",
    description: (name) =>
      `${name} will be retired from breeding and sales tracking but stays on record as part of your farm. It keeps its current cage assignment.`,
    destructive: false,
    confirmLabel: "Mark retired",
  },
  [RabbitStatus.ACTIVE]: {
    title: "Reactivate this rabbit?",
    description: (name) => `${name} will be moved back to active status.`,
    destructive: false,
    confirmLabel: "Reactivate",
  },
}

export function ConfirmStatusChangeDialog({
  open,
  onOpenChange,
  rabbit,
  targetStatus,
  onConfirmed,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rabbit: RabbitTableData | null
  targetStatus: RabbitStatus | null
  onConfirmed: () => void
}) {
  const [isPending, startTransition] = useTransition()

  if (!rabbit || !targetStatus) return null

  const copy = STATUS_COPY[targetStatus]
  const displayName = rabbit.name || rabbit.tagNumber

  function handleConfirm() {
    startTransition(async () => {
      const result = await setRabbitStatus(rabbit!.id, targetStatus!)
      if (result.success) {
        onConfirmed()
        onOpenChange(false)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description(displayName)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={copy.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isPending ? "Confirming…" : copy.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
