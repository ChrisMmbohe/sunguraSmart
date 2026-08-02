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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createFeedLog, updateFeedLog } from "@/app/feeds/actions"
import {
  feedLogFormSchema,
  type FeedLogFormValues,
  type FeedFormOptions,
  type FeedLogRowData,
  type FeedLogDirection,
} from "@/app/feeds/types"

function toDateInputValue(iso?: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10)
  return new Date(iso).toISOString().slice(0, 10)
}

const NONE = "__none__"

export function FeedLogFormDialog({
  open,
  onOpenChange,
  options,
  log,
  defaultDirection,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: FeedFormOptions
  log: FeedLogRowData | null
  defaultDirection: FeedLogDirection
  onSaved: () => void
}) {
  const isEditing = !!log
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FeedLogFormValues>({
    resolver: zodResolver(feedLogFormSchema),
    defaultValues: {
      feedType: "",
      direction: defaultDirection,
      quantity: 0,
      rabbitsFed: undefined,
      cage: NONE,
      date: toDateInputValue(),
      notes: "",
      recordExpense: false,
      vendor: "",
    },
  })

  React.useEffect(() => {
    if (!open) return
    setFormError(null)
    if (log) {
      reset({
        feedType: log.feedTypeId,
        direction: log.direction,
        quantity: log.quantity,
        rabbitsFed: log.rabbitsFed,
        cage: log.cageId || NONE,
        date: toDateInputValue(log.date),
        notes: log.notes ?? "",
        recordExpense: false,
        vendor: "",
      })
    } else {
      reset({
        feedType: "",
        direction: defaultDirection,
        quantity: 0,
        rabbitsFed: undefined,
        cage: NONE,
        date: toDateInputValue(),
        notes: "",
        recordExpense: false,
        vendor: "",
      })
    }
  }, [open, log, defaultDirection, reset])

  const direction = watch("direction")
  const feedType = watch("feedType")
  const cage = watch("cage")
  const recordExpense = watch("recordExpense")

  async function onSubmit(values: FeedLogFormValues) {
    setSubmitting(true)
    setFormError(null)

    const payload: FeedLogFormValues = {
      ...values,
      cage: values.cage === NONE ? "" : values.cage,
    }

    const result = isEditing ? await updateFeedLog(log!.id, payload) : await createFeedLog(payload)

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
          <DialogTitle>
            {isEditing ? "Edit feed log" : direction === "restock" ? "Log a restock" : "Log consumption"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this entry — stock on hand is automatically reconciled."
              : direction === "restock"
                ? "Record feed brought into inventory."
                : "Record feed given out to rabbits."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(v) => setValue("direction", v as FeedLogDirection)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="consumption">Consumption</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Feed type</Label>
            <Select value={feedType} onValueChange={(v) => setValue("feedType", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select feed type" />
              </SelectTrigger>
              <SelectContent>
                {options.feedTypes.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.feedType && <p className="text-xs text-red-600">{errors.feedType.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min={0} step="0.01" {...register("quantity")} />
              {errors.quantity && <p className="text-xs text-red-600">{errors.quantity.message}</p>}
            </div>
            {direction === "consumption" && (
              <div className="grid gap-1.5">
                <Label htmlFor="rabbitsFed">Rabbits fed</Label>
                <Input
                  id="rabbitsFed"
                  type="number"
                  min={0}
                  placeholder="Optional headcount"
                  {...register("rabbitsFed")}
                />
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Cage</Label>
            <Select value={cage || NONE} onValueChange={(v) => setValue("cage", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None (farm-wide)</SelectItem>
                {options.cages.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {direction === "restock" && !isEditing && (
            <div className="grid gap-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recordExpense"
                  checked={recordExpense}
                  onCheckedChange={(v) => setValue("recordExpense", v === true)}
                />
                <Label htmlFor="recordExpense" className="text-sm font-normal">
                  Also log this as an expense
                </Label>
              </div>
              {recordExpense && (
                <>
                  <div className="grid gap-1.5">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input id="vendor" placeholder="Optional — who was paid" {...register("vendor")} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses the feed type&apos;s cost per unit to calculate the expense amount. If it has no cost set,
                    no expense is created.
                  </p>
                </>
              )}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="log-notes">Notes</Label>
            <Textarea id="log-notes" rows={2} placeholder="Optional details…" {...register("notes")} />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Log entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
