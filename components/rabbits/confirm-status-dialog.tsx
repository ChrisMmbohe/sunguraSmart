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
import { RabbitStatus } from "@/types/enums"

export interface StatusChangeTarget {
  id: string
  label: string // display name (name or tag number) for the confirmation copy
  status: RabbitStatus
}

const STATUS_COPY: Partial<Record<RabbitStatus, { title: string; description: (name: string) => string; confirmLabel: string; destructive: boolean }>> = {
  [RabbitStatus.DECEASED]: {
    title: "Mark as deceased?",
    description: (name) =>
      `This marks ${name} deceased today, sets its health status accordingly, and frees its cage if it has one. This can be corrected later by editing the rabbit, but treat it as a real record.`,
    confirmLabel: "Mark deceased",
    destructive: true,
  },
  [RabbitStatus.RETIRED]: {
    title: "Mark as retired?",
    description: (name) => `${name} will be marked retired and excluded from active breeding stock.`,
    confirmLabel: "Mark retired",
    destructive: false,
  },
  [RabbitStatus.SOLD]: {
    title: "Mark as sold?",
    description: (name) =>
      `${name} will be marked sold and its cage freed. For a full sale record with buyer and price, use the Sales page instead.`,
    confirmLabel: "Mark sold",
    destructive: false,
  },
}

export function ConfirmStatusDialog({
  open,
  onOpenChange,
  target,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: StatusChangeTarget | null
  /** Caller performs the actual server action + refresh. */
  onConfirm: (target: StatusChangeTarget) => Promise<void> | void
}) {
  const [isPending, startTransition] = useTransition()
  const copy = target ? STATUS_COPY[target.status] : undefined

  function handleConfirm() {
    if (!target) return
    startTransition(async () => {
      await onConfirm(target)
      onOpenChange(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy?.title ?? "Change status?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {target && copy ? copy.description(target.label) : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={copy?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isPending ? "Saving…" : copy?.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
