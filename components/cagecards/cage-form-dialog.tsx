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
import { CageType, CageStatus } from "@/types/enums"
import { cageFormSchema, type CageFormValues, type CageCardData } from "@/app/cagecards/types"
import { createCage, updateCage } from "@/app/cagecards/actions"

function toFormValues(cage?: CageCardData): CageFormValues {
  return {
    label: cage?.label ?? "",
    type: cage?.type ?? (Object.values(CageType)[0] as CageType),
    status: cage?.status,
    capacity: cage?.capacity ?? 1,
    location: cage?.location ?? "",
    notes: cage?.notes ?? "",
  }
}

export function CageFormDialog({
  open,
  onOpenChange,
  cage,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present = editing; absent = creating a new cage. */
  cage?: CageCardData
  onSaved: () => void
}) {
  const isEditing = Boolean(cage)
  const [values, setValues] = React.useState<CageFormValues>(() => toFormValues(cage))
  const [fieldErrors, setFieldErrors] = React.useState<Partial<Record<keyof CageFormValues, string>>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  React.useEffect(() => {
    if (open) {
      setValues(toFormValues(cage))
      setFieldErrors({})
      setFormError(null)
    }
  }, [open, cage])

  function set<K extends keyof CageFormValues>(key: K, value: CageFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = cageFormSchema.safeParse(values)
    if (!parsed.success) {
      const errors: Partial<Record<keyof CageFormValues, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CageFormValues
        errors[key] = issue.message
      }
      setFieldErrors(errors)
      setFormError("Please fix the highlighted fields.")
      return
    }

    setFieldErrors({})
    setFormError(null)

    startTransition(async () => {
      const result =
        isEditing && cage ? await updateCage(cage.id, parsed.data) : await createCage(parsed.data)

      if (result.success) {
        onSaved()
        onOpenChange(false)
      } else {
        setFormError(result.error ?? "Something went wrong.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit cage" : "Add cage"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update this cage's details." : "Register a new cage on your farm."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              value={values.label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("label", e.target.value)}
              placeholder="e.g. Row A - Cage 3"
            />
            {fieldErrors.label && <p className="text-xs text-destructive">{fieldErrors.label}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={values.type} onValueChange={(v: string) => set("type", v as CageType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CageType).map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={values.capacity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  set("capacity", e.target.value ? Number(e.target.value) : 1)
                }
              />
              {fieldErrors.capacity && <p className="text-xs text-destructive">{fieldErrors.capacity}</p>}
            </div>
          </div>

          {isEditing && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={values.status ?? ""}
                onValueChange={(v: string) => set("status", v as CageStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto (based on occupants)" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CageStatus).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Occupied/empty are set automatically when rabbits are assigned or vacated — only
                override this for states like maintenance.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("location", e.target.value)}
              placeholder="Shed / row description"
            />
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
              {isPending ? "Saving…" : isEditing ? "Save changes" : "Add cage"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
