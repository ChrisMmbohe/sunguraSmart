"use client"

import * as React from "react"
import { useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Gender, RabbitStatus, HealthStatus, AcquisitionType, RabbitPurpose } from "@/types/enums"
import { rabbitFormSchema, type RabbitFormValues, type RabbitFormOptions, type RabbitTableData } from "@/app/rabbits/types"
import { createRabbit, updateRabbit } from "@/app/rabbits/actions"

const NONE = "__none__"

function toFormValues(rabbit?: RabbitTableData): RabbitFormValues {
  return {
    tagNumber: rabbit?.tagNumber ?? "",
    name: rabbit?.name ?? "",
    breed: rabbit?.breedId ?? "",
    gender: rabbit?.gender ?? Gender.FEMALE,
    dateOfBirth: rabbit?.dateOfBirth ? rabbit.dateOfBirth.slice(0, 10) : "",
    status: rabbit?.status ?? RabbitStatus.ACTIVE,
    healthStatus: rabbit?.healthStatus ?? HealthStatus.HEALTHY,
    acquisitionType: rabbit?.acquisitionType ?? AcquisitionType.BORN_ON_FARM,
    acquisitionDate: rabbit?.acquisitionDate ? rabbit.acquisitionDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    sourceFarm: rabbit?.sourceFarm ?? "",
    acquisitionCost: rabbit?.acquisitionCost,
    purpose: rabbit?.purpose ?? RabbitPurpose.BREEDING_STOCK,
    cage: rabbit?.cageId ?? "",
    sire: rabbit?.sireId ?? "",
    dam: rabbit?.damId ?? "",
    color: rabbit?.color ?? "",
    markings: rabbit?.markings ?? "",
    notes: rabbit?.notes ?? "",
  }
}

export function RabbitFormDialog({
  open,
  onOpenChange,
  options,
  rabbit,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: RabbitFormOptions
  /** Present = editing; absent = creating a new rabbit. */
  rabbit?: RabbitTableData
  onSaved: () => void
}) {
  const isEditing = Boolean(rabbit)
  const [values, setValues] = React.useState<RabbitFormValues>(() => toFormValues(rabbit))
  const [fieldErrors, setFieldErrors] = React.useState<Partial<Record<keyof RabbitFormValues, string>>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Reset the form whenever a different rabbit is opened for editing, or
  // the dialog is opened fresh for "Add rabbit".
  React.useEffect(() => {
    if (open) {
      setValues(toFormValues(rabbit))
      setFieldErrors({})
      setFormError(null)
    }
  }, [open, rabbit])

  function set<K extends keyof RabbitFormValues>(key: K, value: RabbitFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = rabbitFormSchema.safeParse(values)
    if (!parsed.success) {
      const errors: Partial<Record<keyof RabbitFormValues, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof RabbitFormValues
        errors[key] = issue.message
      }
      setFieldErrors(errors)
      setFormError("Please fix the highlighted fields.")
      return
    }

    setFieldErrors({})
    setFormError(null)

    startTransition(async () => {
      const result = isEditing && rabbit
        ? await updateRabbit(rabbit.id, parsed.data)
        : await createRabbit(parsed.data)

      if (result.success) {
        onSaved()
        onOpenChange(false)
      } else {
        setFormError(result.error ?? "Something went wrong.")
      }
    })
  }

  const bucksExcludingSelf = options.bucks.filter((b) => b.value !== rabbit?.id)
  const doesExcludingSelf = options.does.filter((d) => d.value !== rabbit?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit rabbit" : "Add rabbit"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this rabbit's details."
              : "Record a new rabbit born on the farm or acquired externally."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tagNumber">Tag number *</Label>
              <Input
                id="tagNumber"
                value={values.tagNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("tagNumber", e.target.value)}
                placeholder="e.g. JRF-0142"
              />
              {fieldErrors.tagNumber && <p className="text-xs text-destructive">{fieldErrors.tagNumber}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={values.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Breed *</Label>
              <Select value={values.breed} onValueChange={(v: string) => set("breed", v)}>
                <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                <SelectContent>
                  {options.breeds.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.breed && <p className="text-xs text-destructive">{fieldErrors.breed}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Gender *</Label>
              <Select value={values.gender} onValueChange={(v: string) => set("gender", v as Gender)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={Gender.FEMALE}>Doe (female)</SelectItem>
                  <SelectItem value={Gender.MALE}>Buck (male)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={values.dateOfBirth}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("dateOfBirth", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={values.status} onValueChange={(v: string) => set("status", v as RabbitStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(RabbitStatus).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Health *</Label>
              <Select value={values.healthStatus} onValueChange={(v: string) => set("healthStatus", v as HealthStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(HealthStatus).map((h) => (
                    <SelectItem key={h} value={h} className="capitalize">{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Sire (father)</Label>
              <Select value={values.sire || NONE} onValueChange={(v: string) => set("sire", v === NONE ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Unknown" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unknown</SelectItem>
                  {bucksExcludingSelf.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dam (mother)</Label>
              <Select value={values.dam || NONE} onValueChange={(v: string) => set("dam", v === NONE ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Unknown" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unknown</SelectItem>
                  {doesExcludingSelf.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Acquisition *</Label>
              <Select value={values.acquisitionType} onValueChange={(v: string) => set("acquisitionType", v as AcquisitionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(AcquisitionType).map((a) => (
                    <SelectItem key={a} value={a} className="capitalize">{a.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acqDate">Acquisition date *</Label>
              <Input
                id="acqDate"
                type="date"
                value={values.acquisitionDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("acquisitionDate", e.target.value)}
              />
              {fieldErrors.acquisitionDate && <p className="text-xs text-destructive">{fieldErrors.acquisitionDate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acqCost">Cost (KES)</Label>
              <Input
                id="acqCost"
                type="number"
                min={0}
                step="0.01"
                value={values.acquisitionCost ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("acquisitionCost", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {values.acquisitionType !== AcquisitionType.BORN_ON_FARM && (
            <div className="space-y-1.5">
              <Label htmlFor="sourceFarm">Source farm</Label>
              <Input
                id="sourceFarm"
                value={values.sourceFarm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("sourceFarm", e.target.value)}
                placeholder="Where this rabbit came from"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Purpose *</Label>
              <Select value={values.purpose} onValueChange={(v: string) => set("purpose", v as RabbitPurpose)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(RabbitPurpose).map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Cage</Label>
              <Select value={values.cage || NONE} onValueChange={(v: string) => set("cage", v === NONE ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Unassigned</SelectItem>
                  {options.cages.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="color">Color</Label>
              <Input id="color" value={values.color} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("color", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="markings">Markings</Label>
              <Input id="markings" value={values.markings} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("markings", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("notes", e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEditing ? "Save changes" : "Add rabbit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
