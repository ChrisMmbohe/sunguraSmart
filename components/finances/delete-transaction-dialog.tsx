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
import { deleteSale, deleteExpense } from "@/app/finances/actions"
import { useCurrency } from "@/components/providers/currency-provider"
import type { FinanceTransactionData } from "@/app/finances/types"

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: FinanceTransactionData | null
  onDeleted: () => void
}) {
  const [pending, setPending] = React.useState(false)
  const { format } = useCurrency()

  async function handleDelete() {
    if (!transaction) return
    setPending(true)
    const result =
      transaction.kind === "sale" ? await deleteSale(transaction.id) : await deleteExpense(transaction.id)
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
          <AlertDialogTitle>
            Delete this {transaction?.kind === "sale" ? "sale" : "expense"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the {transaction?.kind} of {transaction ? format(transaction.amount) : ""} for{" "}
            {transaction?.counterparty}. This can't be undone.
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
