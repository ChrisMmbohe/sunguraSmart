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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createFeedType, updateFeedType } from "@/app/feeds/actions"
import { feedTypeFormSchema, type FeedTypeFormValues, type FeedTypeRowData } from "@/app/feeds/types"
import { FeedCategory, FeedUnit } from "@/types/enums"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const emptyDefaults: FeedTypeFormValues = {
  name: "",
  category: FeedCategory.PELLETS,
  unit: FeedUnit.KG,
  stockOnHand: 0,
  reorderThreshold: 0,
  costPerUnit: 0,
  consumptionRatePerRabbit: 0.1,
  consumptionPeriodDays: 1,
}

export function FeedTypeFormDialog({
  open,
  onOpenChange,
  feedType,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedType: FeedTypeRowData | null
  onSaved: () => void
}) {
  const isEditing = !!feedType
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FeedTypeFormValues>({
    resolver: zodResolver(feedTypeFormSchema),
    defaultValues: emptyDefaults,
  })

  React.useEffect(() => {
    if (!open) return
    setFormError(null)
    if (feedType) {
      reset({
        name: feedType.name,
        category: feedType.category,
        unit: feedType.unit,
        stockOnHand: feedType.stockOnHand,
        reorderThreshold: feedType.reorderThreshold,
        costPerUnit: feedType.costPerUnit ?? 0,
        consumptionRatePerRabbit: feedType.consumptionRatePerRabbit,
        consumptionPeriodDays: feedType.consumptionPeriodDays,
      })
    } else {
      reset(emptyDefaults)
    }
  }, [open, feedType, reset])

  const category = watch("category")
  const unit = watch("unit")

  async function onSubmit(values: FeedTypeFormValues) {
    setSubmitting(true)
    setFormError(null)

    const result = isEditing ? await updateFeedType(feedType!.id, values) : await createFeedType(values)

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
          <DialogTitle>{isEditing ? "Edit feed type" : "New feed type"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this feed type's details. Adjust stock via restock/consumption logs where possible — edit it here only to correct a mistake."
              : "Add a feed type to start tracking its inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Rabbit Pellets - Grower" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setValue("category", v as FeedCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FeedCategory).map((c) => (
                    <SelectItem key={c} value={c}>
                      {toTitleCase(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(v) => setValue("unit", v as FeedUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FeedUnit).map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="stockOnHand">
                Stock on hand
                {isEditing && <span className="ml-1 text-xs font-normal text-muted-foreground">(correction only)</span>}
              </Label>
              <Input id="stockOnHand" type="number" min={0} step="0.01" {...register("stockOnHand")} />
              {errors.stockOnHand && <p className="text-xs text-red-600">{errors.stockOnHand.message}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="reorderThreshold">Reorder threshold</Label>
              <Input id="reorderThreshold" type="number" min={0} step="0.01" {...register("reorderThreshold")} />
              {errors.reorderThreshold && (
                <p className="text-xs text-red-600">{errors.reorderThreshold.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="costPerUnit">Cost per unit</Label>
            <Input id="costPerUnit" type="number" min={0} step="0.01" {...register("costPerUnit")} />
            {errors.costPerUnit && <p className="text-xs text-red-600">{errors.costPerUnit.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="consumptionRatePerRabbit">Consumption rate / rabbit</Label>
              <Input
                id="consumptionRatePerRabbit"
                type="number"
                min={0}
                step="0.01"
                {...register("consumptionRatePerRabbit")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="consumptionPeriodDays">Per (days)</Label>
              <Input id="consumptionPeriodDays" type="number" min={1} {...register("consumptionPeriodDays")} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Used to project days-of-stock remaining, e.g. 0.1 kg per rabbit every 1 day.
          </p>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Add feed type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
