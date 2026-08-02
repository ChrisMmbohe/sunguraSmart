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

import { createSchedule, updateSchedule } from "@/app/schedule/actions"
import { scheduleFormSchema, type ScheduleFormValues, type ScheduleFormOptions, type ScheduleTableData } from "@/app/schedule/types"
import { ScheduleType, ScheduleStatus, RecurrenceFrequency } from "@/types/enums"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function toDateInputValue(iso?: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10)
  return new Date(iso).toISOString().slice(0, 10)
}

const FARM_WIDE = "__farm_wide__"

export function ScheduleFormDialog({
  open,
  onOpenChange,
  options,
  schedule,
  defaultDate,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: ScheduleFormOptions
  schedule?: ScheduleTableData
  defaultDate?: Date
  onSaved: () => void
}) {
  const isEditing = !!schedule
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: "",
      type: ScheduleType.OTHER,
      rabbit: FARM_WIDE,
      dueDate: toDateInputValue(),
      status: ScheduleStatus.PENDING,
      recurrenceFrequency: RecurrenceFrequency.NONE,
      notes: "",
    },
  })

  React.useEffect(() => {
    if (!open) return
    setFormError(null)
    reset({
      title: schedule?.title ?? "",
      type: schedule?.type ?? ScheduleType.OTHER,
      rabbit: schedule?.rabbitId ?? FARM_WIDE,
      dueDate: toDateInputValue(schedule?.dueDate ?? defaultDate?.toISOString()),
      status: schedule?.status ?? ScheduleStatus.PENDING,
      recurrenceFrequency: schedule?.recurrenceFrequency ?? RecurrenceFrequency.NONE,
      recurrenceCustomDays: schedule?.recurrenceCustomDays,
      notes: schedule?.notes ?? "",
    })
  }, [open, schedule, defaultDate, reset])

  const recurrenceFrequency = watch("recurrenceFrequency")
  const rabbitValue = watch("rabbit")
  const typeValue = watch("type")
  const statusValue = watch("status")

  async function onSubmit(values: ScheduleFormValues) {
    setSubmitting(true)
    setFormError(null)

    const payload: ScheduleFormValues = {
      ...values,
      rabbit: values.rabbit === FARM_WIDE ? "" : values.rabbit,
    }

    const result = isEditing ? await updateSchedule(schedule!.id, payload) : await createSchedule(payload)

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
          <DialogTitle>{isEditing ? "Edit schedule item" : "Add schedule item"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this task's details, or change its status directly."
              : "Create a one-time or recurring task for the farm or a specific rabbit."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Deworm does in cage row B" {...register("title")} />
            {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={typeValue} onValueChange={(v) => setValue("type", v as ScheduleType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ScheduleType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {toTitleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && <p className="text-xs text-red-600">{errors.dueDate.message}</p>}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Rabbit</Label>
            <Select value={rabbitValue || FARM_WIDE} onValueChange={(v) => setValue("rabbit", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FARM_WIDE}>Farm-wide (no specific rabbit)</SelectItem>
                {options.rabbits.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Repeats</Label>
              <Select
                value={recurrenceFrequency}
                onValueChange={(v) => setValue("recurrenceFrequency", v as RecurrenceFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RecurrenceFrequency).map((f) => (
                    <SelectItem key={f} value={f}>
                      {f === RecurrenceFrequency.NONE ? "One-time" : toTitleCase(f)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {recurrenceFrequency === RecurrenceFrequency.CUSTOM_DAYS && (
              <div className="grid gap-1.5">
                <Label htmlFor="recurrenceCustomDays">Every N days</Label>
                <Input
                  id="recurrenceCustomDays"
                  type="number"
                  min={1}
                  {...register("recurrenceCustomDays")}
                />
                {errors.recurrenceCustomDays && (
                  <p className="text-xs text-red-600">{errors.recurrenceCustomDays.message}</p>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={statusValue} onValueChange={(v) => setValue("status", v as ScheduleStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ScheduleStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {toTitleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Prefer the row menu's "Mark completed" action when possible — it auto-creates the next
                occurrence for recurring tasks.
              </p>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} placeholder="Optional details…" {...register("notes")} />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEditing ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
