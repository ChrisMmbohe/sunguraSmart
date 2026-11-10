"use client"

import * as React from "react"
import { useTransition } from "react"
import { Plus } from "lucide-react"
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
import { createBreed, createRabbit, updateRabbit } from "@/app/rabbits/actions"

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
  const [breedDialogOpen, setBreedDialogOpen] = React.useState(false)
  const [newBreedName, setNewBreedName] = React.useState("")
  const [newBreedDescription, setNewBreedDescription] = React.useState("")
  const [newBreedWeight, setNewBreedWeight] = React.useState("")
  const [newBreedLitterSize, setNewBreedLitterSize] = React.useState("")
  const [newBreedGestationDays, setNewBreedGestationDays] = React.useState("31")
  const [newBreedMaturityAgeDays, setNewBreedMaturityAgeDays] = React.useState("150")
  const [newBreedWeaningAgeDays, setNewBreedWeaningAgeDays] = React.useState("42")
  const [breedError, setBreedError] = React.useState<string | null>(null)
  const [breedOptions, setBreedOptions] = React.useState(options.breeds)
  const [purchaseAgeMonths, setPurchaseAgeMonths] = React.useState("")

  // Reset the form whenever a different rabbit is opened for editing, or
  // the dialog is opened fresh for "Add rabbit".
  React.useEffect(() => {
    setBreedOptions(options.breeds)
    if (open) {
      setValues(toFormValues(rabbit))
      setPurchaseAgeMonths(rabbit?.ageDays != null ? String(Math.floor(rabbit.ageDays / 30.4375)) : "")
      setFieldErrors({})
      setFormError(null)
    }
  }, [open, rabbit, options.breeds])

  function handleCreateBreed(e: React.FormEvent) {
    e.preventDefault()
    setBreedError(null)

    startTransition(async () => {
      const result = await createBreed({
        name: newBreedName,
        description: newBreedDescription,
        averageAdultWeightKg: newBreedWeight ? Number(newBreedWeight) : undefined,
        averageLitterSize: newBreedLitterSize ? Number(newBreedLitterSize) : undefined,
        gestationDays: Number(newBreedGestationDays),
        maturityAgeDays: Number(newBreedMaturityAgeDays),
        weaningAgeDays: Number(newBreedWeaningAgeDays),
      })
      if (!result.success || !result.data) {
        setBreedError(result.error ?? "Could not add the breed.")
        return
      }

      const option = { value: result.data.id, label: result.data.name }
      setBreedOptions((current) => [...current.filter((breed) => breed.value !== option.value), option])
      set("breed", option.value)
      setNewBreedName("")
      setNewBreedDescription("")
      setNewBreedWeight("")
      setNewBreedLitterSize("")
      setNewBreedGestationDays("31")
      setNewBreedMaturityAgeDays("150")
      setNewBreedWeaningAgeDays("42")
      setBreedDialogOpen(false)
    })
  }

  function set<K extends keyof RabbitFormValues>(key: K, value: RabbitFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valuesForSubmit = {
      ...values,
      acquisitionCost: values.acquisitionType === AcquisitionType.PURCHASED ? values.acquisitionCost : undefined,
      ...(values.acquisitionType === AcquisitionType.PURCHASED && purchaseAgeMonths ? { dateOfBirth: (() => {
          const birthDate = new Date()
          birthDate.setHours(12, 0, 0, 0)
          birthDate.setMonth(birthDate.getMonth() - Number(purchaseAgeMonths))
          return birthDate.toISOString().slice(0, 10)
        })() } : {}),
    }
    const parsed = rabbitFormSchema.safeParse(valuesForSubmit)
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
  const cageOptions = rabbit?.cageId && rabbit.cageLabel && !options.cages.some((c) => c.value === rabbit.cageId)
    ? [{ value: rabbit.cageId, label: rabbit.cageLabel }, ...options.cages]
    : options.cages

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
              <div className="flex h-7 items-center justify-between">
                <Label>Breed *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setBreedError(null)
                    setBreedDialogOpen(true)
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add breed
                </Button>
              </div>
              <Select value={values.breed} onValueChange={(v: string) => set("breed", v)}>
                <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                <SelectContent>
                  {breedOptions.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.breed && <p className="text-xs text-destructive">{fieldErrors.breed}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex h-7 items-center">
                <Label>Gender *</Label>
              </div>
              <Select value={values.gender} onValueChange={(v: string) => set("gender", v as Gender)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={Gender.FEMALE}>Doe (female)</SelectItem>
                  <SelectItem value={Gender.MALE}>Buck (male)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <section className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-semibold">Acquisition details</h3>
              <p className="mt-1 text-xs text-muted-foreground">Tell us how this rabbit joined your farm.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              {values.acquisitionType !== AcquisitionType.BORN_ON_FARM && (
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
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dob">
                  {values.acquisitionType === AcquisitionType.PURCHASED ? "Age (months)" : `Date of birth${values.acquisitionType === AcquisitionType.BORN_ON_FARM ? " *" : ""}`}
                </Label>
                <Input
                  id="dob"
                  type={values.acquisitionType === AcquisitionType.PURCHASED ? "number" : "date"}
                  min={values.acquisitionType === AcquisitionType.PURCHASED ? 0 : undefined}
                  step={values.acquisitionType === AcquisitionType.PURCHASED ? 1 : undefined}
                  value={values.acquisitionType === AcquisitionType.PURCHASED ? purchaseAgeMonths : values.dateOfBirth}
                  disabled={values.acquisitionType !== AcquisitionType.BORN_ON_FARM && values.acquisitionType !== AcquisitionType.PURCHASED}
                  required={values.acquisitionType === AcquisitionType.BORN_ON_FARM}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => values.acquisitionType === AcquisitionType.PURCHASED
                    ? setPurchaseAgeMonths(e.target.value)
                    : set("dateOfBirth", e.target.value)}
                />
                {fieldErrors.dateOfBirth && values.acquisitionType !== AcquisitionType.PURCHASED && <p className="text-xs text-destructive">{fieldErrors.dateOfBirth}</p>}
              </div>
              {values.acquisitionType === AcquisitionType.PURCHASED && (
                <div className="space-y-1.5">
                  <Label htmlFor="acqCost">Cost (KES) *</Label>
                  <Input
                    id="acqCost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={values.acquisitionCost ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("acquisitionCost", e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldErrors.acquisitionCost && <p className="text-xs text-destructive">{fieldErrors.acquisitionCost}</p>}
                </div>
              )}
            </div>

            {values.acquisitionType === AcquisitionType.BORN_ON_FARM && (
              <div className="space-y-3 border-t border-border/60 pt-4">
                <div>
                  <p className="text-sm font-medium">Parentage</p>
                  <p className="mt-1 text-xs text-muted-foreground">Link this rabbit to its parents for breeding records.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Sire (father) *</Label>
                    <Select value={values.sire} onValueChange={(v: string) => set("sire", v)}>
                      <SelectTrigger><SelectValue placeholder="Select sire" /></SelectTrigger>
                      <SelectContent>
                        {bucksExcludingSelf.map((b) => (
                          <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dam (mother) *</Label>
                    <Select value={values.dam} onValueChange={(v: string) => set("dam", v)}>
                      <SelectTrigger><SelectValue placeholder="Select dam" /></SelectTrigger>
                      <SelectContent>
                        {doesExcludingSelf.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {values.acquisitionType !== AcquisitionType.BORN_ON_FARM && (
              <div className="space-y-1.5 border-t border-border/60 pt-4">
                <Label htmlFor="sourceFarm">Source farm</Label>
                <Input
                  id="sourceFarm"
                  value={values.sourceFarm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("sourceFarm", e.target.value)}
                  placeholder="Where this rabbit came from"
                />
              </div>
            )}
          </section>

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
                  {cageOptions.map((c) => (
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("notes", e.target.value)}
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

      <Dialog open={breedDialogOpen} onOpenChange={setBreedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add breed</DialogTitle>
            <DialogDescription>Add a breed to your farm&apos;s breed list.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBreed} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-breed-name">Breed name</Label>
              <Input
                id="new-breed-name"
                value={newBreedName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBreedName(e.target.value)}
                placeholder="e.g. New Zealand White"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-breed-description">Description</Label>
              <Textarea
                id="new-breed-description"
                value={newBreedDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewBreedDescription(e.target.value)}
                placeholder="Optional notes about this breed"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-breed-weight">Average adult weight (kg)</Label>
                <Input
                  id="new-breed-weight"
                  type="number"
                  min={0}
                  step="0.01"
                  value={newBreedWeight}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBreedWeight(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-breed-litter-size">Average litter size</Label>
                <Input
                  id="new-breed-litter-size"
                  type="number"
                  min={0}
                  step="1"
                  value={newBreedLitterSize}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBreedLitterSize(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-breed-gestation">Gestation (days)</Label>
                <Input
                  id="new-breed-gestation"
                  type="number"
                  min={1}
                  step="1"
                  value={newBreedGestationDays}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBreedGestationDays(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-breed-maturity">Maturity age (days)</Label>
                <Input
                  id="new-breed-maturity"
                  type="number"
                  min={1}
                  step="1"
                  value={newBreedMaturityAgeDays}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBreedMaturityAgeDays(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-breed-weaning">Weaning age (days)</Label>
                <Input
                  id="new-breed-weaning"
                  type="number"
                  min={1}
                  step="1"
                  value={newBreedWeaningAgeDays}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBreedWeaningAgeDays(e.target.value)}
                />
              </div>
            </div>
            {breedError && <p className="text-xs text-destructive">{breedError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBreedDialogOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding…" : "Add breed"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
