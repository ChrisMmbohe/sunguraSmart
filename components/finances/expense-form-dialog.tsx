"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createExpense, updateExpense } from "@/app/finances/actions"
import { expenseFormSchema, type ExpenseFormValues, type FinanceFormOptions, type ExpenseDetailData } from "@/app/finances/types"
import { ExpenseCategory, PaymentMethod } from "@/types/enums"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function toDateInputValue(iso?: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10)
  return new Date(iso).toISOString().slice(0, 10)
}

const NONE = "__none__"

export function ExpenseFormDialog({
  open,
  onOpenChange,
  options,
  expenseId,
  detail,
  loading,
  defaultDate,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: FinanceFormOptions
  expenseId?: string
  detail?: ExpenseDetailData | null
  loading?: boolean
  defaultDate?: Date
  onSaved: () => void
}) {
  const isEditing = !!expenseId
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      category: ExpenseCategory.UPKEEP,
      description: "",
      amount: 0,
      paymentMethod: PaymentMethod.CASH,
      date: toDateInputValue(defaultDate?.toISOString()),
      relatedRabbit: NONE,
      relatedFeedType: NONE,
      vendor: "",
      notes: "",
    },
  })

  React.useEffect(() => {
    if (!open) return
    setFormError(null)
    if (detail) {
      reset({
        category: detail.category,
        description: detail.description,
        amount: detail.amount,
        paymentMethod: detail.paymentMethod,
        date: toDateInputValue(detail.date),
        relatedRabbit: detail.relatedRabbit || NONE,
        relatedFeedType: detail.relatedFeedType || NONE,
        vendor: detail.vendor ?? "",
        notes: detail.notes ?? "",
      })
    } else if (!isEditing) {
      reset({
        category: ExpenseCategory.UPKEEP,
        description: "",
        amount: 0,
        paymentMethod: PaymentMethod.CASH,
        date: toDateInputValue(defaultDate?.toISOString()),
        relatedRabbit: NONE,
        relatedFeedType: NONE,
        vendor: "",
        notes: "",
      })
    }
  }, [open, detail, isEditing, defaultDate, reset])

  const category = watch("category")
  const paymentMethod = watch("paymentMethod")
  const relatedRabbit = watch("relatedRabbit")
  const relatedFeedType = watch("relatedFeedType")

  async function onSubmit(values: ExpenseFormValues) {
    setSubmitting(true)
    setFormError(null)

    const payload: ExpenseFormValues = {
      ...values,
      relatedRabbit: values.relatedRabbit === NONE ? "" : values.relatedRabbit,
      relatedFeedType: values.relatedFeedType === NONE ? "" : values.relatedFeedType,
    }

    const result = isEditing ? await updateExpense(expenseId!, payload) : await createExpense(payload)

    setSubmitting(false)
    if (result.success) {
      onOpenChange(false)
      onSaved()
    } else {
      setFormError(result.error ?? "Something went wrong.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit expense" : "Log an expense"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this expense's details." : "Record feed, vet, upkeep, or any other farm cost."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading expense…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="e.g. 3 bags of pellets" {...register("description")} />
              {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setValue("category", v as ExpenseCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ExpenseCategory).map((c) => (
                      <SelectItem key={c} value={c}>
                        {toTitleCase(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" min={0} step="0.01" {...register("amount")} />
                {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date")} />
                {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setValue("paymentMethod", v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PaymentMethod).map((p) => (
                      <SelectItem key={p} value={p}>
                        {toTitleCase(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="vendor">Vendor</Label>
              <Input id="vendor" placeholder="Optional — who was paid" {...register("vendor")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Related rabbit</Label>
                <Select value={relatedRabbit || NONE} onValueChange={(v) => setValue("relatedRabbit", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {options.rabbits.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Related feed type</Label>
                <Select value={relatedFeedType || NONE} onValueChange={(v) => setValue("relatedFeedType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {options.feedTypes.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="expense-notes">Notes</Label>
              <Textarea id="expense-notes" rows={2} placeholder="Optional details…" {...register("notes")} />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : isEditing ? "Save changes" : "Log expense"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
