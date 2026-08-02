"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { BookOpen } from "lucide-react"

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

import { createHealthRecord, updateHealthRecord } from "@/app/health/actions"
import {
  healthRecordFormSchema,
  type HealthRecordFormValues,
  type HealthRecordFormOptions,
  type HealthRecordTableData,
} from "@/app/health/types"
import { HealthRecordType, HealthRecordOutcome } from "@/types/enums"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function toDateInputValue(iso?: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10)
  return new Date(iso).toISOString().slice(0, 10)
}

const NO_DISEASE = "__no_disease__"

export function HealthRecordFormDialog({
  open,
  onOpenChange,
  options,
  record,
  defaultRabbitId,
  onSaved,
  onManageDiseases,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: HealthRecordFormOptions
  record?: HealthRecordTableData
  defaultRabbitId?: string
  onSaved: () => void
  onManageDiseases: () => void
}) {
  const isEditing = !!record
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<HealthRecordFormValues>({
    resolver: zodResolver(healthRecordFormSchema),
    defaultValues: {
      rabbit: "",
      type: HealthRecordType.ROUTINE_CHECKUP,
      disease: NO_DISEASE,
      date: toDateInputValue(),
      outcome: HealthRecordOutcome.ONGOING,
      followUpDate: "",
      treatment: "",
      medication: "",
      dosage: "",
      notes: "",
    },
  })

  React.useEffect(() => {
    if (!open) return
    setFormError(null)
    reset({
      rabbit: record?.rabbitId ?? defaultRabbitId ?? "",
      type: record?.type ?? HealthRecordType.ROUTINE_CHECKUP,
      disease: record?.diseaseId ?? NO_DISEASE,
      date: toDateInputValue(record?.date),
      outcome: record?.outcome ?? HealthRecordOutcome.ONGOING,
      followUpDate: record?.followUpDate ? toDateInputValue(record.followUpDate) : "",
      treatment: record?.treatment ?? "",
      medication: record?.medication ?? "",
      dosage: record?.dosage ?? "",
      cost: record?.cost,
      notes: record?.notes ?? "",
    })
  }, [open, record, defaultRabbitId, reset])

  const rabbitValue = watch("rabbit")
  const typeValue = watch("type")
  const diseaseValue = watch("disease")
  const outcomeValue = watch("outcome")

  async function onSubmit(values: HealthRecordFormValues) {
    setSubmitting(true)
    setFormError(null)

    const payload: HealthRecordFormValues = {
      ...values,
      disease: values.disease === NO_DISEASE ? "" : values.disease,
    }

    const result = isEditing ? await updateHealthRecord(record!.id, payload) : await createHealthRecord(payload)

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
          <DialogTitle>{isEditing ? "Edit health record" : "Log health record"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this record's details, treatment, or outcome."
              : "Record a checkup, illness, injury, vaccination, or treatment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Rabbit</Label>
              <Select value={rabbitValue} onValueChange={(v) => setValue("rabbit", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a rabbit" />
                </SelectTrigger>
                <SelectContent>
                  {options.rabbits.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rabbit && <p className="text-xs text-red-600">{errors.rabbit.message}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={typeValue} onValueChange={(v) => setValue("type", v as HealthRecordType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(HealthRecordType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {toTitleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Outcome</Label>
              <Select value={outcomeValue} onValueChange={(v) => setValue("outcome", v as HealthRecordOutcome)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(HealthRecordOutcome).map((o) => (
                    <SelectItem key={o} value={o}>
                      {toTitleCase(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Disease (optional)</Label>
              <button
                type="button"
                onClick={onManageDiseases}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                <BookOpen className="h-3 w-3" />
                Manage catalog
              </button>
            </div>
            <Select value={diseaseValue || NO_DISEASE} onValueChange={(v) => setValue("disease", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DISEASE}>None</SelectItem>
                {options.diseases.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                    {d.isContagious ? " (contagious)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="medication">Medication</Label>
              <Input id="medication" {...register("medication")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dosage">Dosage</Label>
              <Input id="dosage" placeholder="e.g. 0.2ml daily" {...register("dosage")} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="treatment">Treatment</Label>
            <Textarea id="treatment" rows={2} {...register("treatment")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cost">Cost</Label>
              <Input id="cost" type="number" min={0} step="0.01" {...register("cost")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="followUpDate">Follow-up date</Label>
              <Input id="followUpDate" type="date" {...register("followUpDate")} />
              {errors.followUpDate && <p className="text-xs text-red-600">{errors.followUpDate.message}</p>}
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Setting a follow-up date automatically creates (or updates) a matching Schedule task.
          </p>

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} placeholder="Optional details…" {...register("notes")} />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Log record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
