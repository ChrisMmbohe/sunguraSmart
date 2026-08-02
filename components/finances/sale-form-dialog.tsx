"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"

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

import { createSale, updateSale } from "@/app/finances/actions"
import { saleFormSchema, type SaleFormValues, type FinanceFormOptions, type SaleDetailData } from "@/app/finances/types"
import { SaleItemType, PaymentMethod } from "@/types/enums"
import { useCurrency } from "@/components/providers/currency-provider"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function toDateInputValue(iso?: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10)
  return new Date(iso).toISOString().slice(0, 10)
}

const NO_RABBIT = "__no_rabbit__"

const emptyItem = { itemType: SaleItemType.LIVE_RABBIT, rabbit: "", description: "", quantity: 1, unitPrice: 0 }

export function SaleFormDialog({
  open,
  onOpenChange,
  options,
  saleId,
  detail,
  loading,
  defaultDate,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: FinanceFormOptions
  saleId?: string
  detail?: SaleDetailData | null
  loading?: boolean
  defaultDate?: Date
  onSaved: () => void
}) {
  const isEditing = !!saleId
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const { format } = useCurrency()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      buyerName: "",
      buyerContact: "",
      items: [emptyItem],
      paymentMethod: PaymentMethod.CASH,
      date: toDateInputValue(defaultDate?.toISOString()),
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  React.useEffect(() => {
    if (!open) return
    setFormError(null)
    if (detail) {
      reset({
        buyerName: detail.buyerName,
        buyerContact: detail.buyerContact ?? "",
        items: detail.items.map((i) => ({ ...i, rabbit: i.rabbit || "" })),
        paymentMethod: detail.paymentMethod,
        date: toDateInputValue(detail.date),
        notes: detail.notes ?? "",
      })
    } else if (!isEditing) {
      reset({
        buyerName: "",
        buyerContact: "",
        items: [emptyItem],
        paymentMethod: PaymentMethod.CASH,
        date: toDateInputValue(defaultDate?.toISOString()),
        notes: "",
      })
    }
  }, [open, detail, isEditing, defaultDate, reset])

  const items = watch("items")
  const paymentMethod = watch("paymentMethod")
  const total = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)

  async function onSubmit(values: SaleFormValues) {
    setSubmitting(true)
    setFormError(null)

    const payload: SaleFormValues = {
      ...values,
      items: values.items.map((i) => ({ ...i, rabbit: i.rabbit === NO_RABBIT ? "" : i.rabbit })),
    }

    const result = isEditing ? await updateSale(saleId!, payload) : await createSale(payload)

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit sale" : "Log a sale"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the buyer, items, or amounts." : "Record a sale of rabbits, meat, fur, or manure."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading sale…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="buyerName">Buyer name</Label>
                <Input id="buyerName" placeholder="e.g. James Otieno" {...register("buyerName")} />
                {errors.buyerName && <p className="text-xs text-red-600">{errors.buyerName.message}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="buyerContact">Buyer contact</Label>
                <Input id="buyerContact" placeholder="Phone or email" {...register("buyerContact")} />
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

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => append(emptyItem)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add item
                </Button>
              </div>

              <div className="grid gap-2">
                {fields.map((field, index) => {
                  const itemType = watch(`items.${index}.itemType`)
                  const rabbitValue = watch(`items.${index}.rabbit`)

                  return (
                    <div key={field.id} className="grid grid-cols-12 items-start gap-2 rounded-lg border p-2">
                      <div className="col-span-3">
                        <Select
                          value={itemType}
                          onValueChange={(v) => setValue(`items.${index}.itemType`, v as SaleItemType)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(SaleItemType).map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">
                                {toTitleCase(t)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {itemType === SaleItemType.LIVE_RABBIT ? (
                        <div className="col-span-4">
                          <Select
                            value={rabbitValue || NO_RABBIT}
                            onValueChange={(v) => setValue(`items.${index}.rabbit`, v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select rabbit" />
                            </SelectTrigger>
                            <SelectContent>
                              {options.rabbits.map((r) => (
                                <SelectItem key={r.value} value={r.value} className="text-xs">
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.items?.[index]?.rabbit && (
                            <p className="text-[10px] text-red-600">{errors.items[index]?.rabbit?.message}</p>
                          )}
                        </div>
                      ) : (
                        <div className="col-span-4">
                          <Input
                            className="h-8 text-xs"
                            placeholder="Description"
                            {...register(`items.${index}.description`)}
                          />
                        </div>
                      )}

                      <div className="col-span-2">
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          min={1}
                          placeholder="Qty"
                          {...register(`items.${index}.quantity`)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Unit price"
                          {...register(`items.${index}.unitPrice`)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {errors.items?.root && <p className="text-xs text-red-600">{errors.items.root.message}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-3 text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="text-base font-semibold">{format(total)}</span>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="sale-notes">Notes</Label>
              <Textarea id="sale-notes" rows={2} placeholder="Optional details…" {...register("notes")} />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : isEditing ? "Save changes" : "Log sale"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
