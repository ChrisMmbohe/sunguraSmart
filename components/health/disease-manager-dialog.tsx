"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createDisease, updateDisease, deleteDisease } from "@/app/health/actions"
import { diseaseFormSchema, type DiseaseFormValues, type DiseaseTableData } from "@/app/health/types"
import { DiseaseSeverity } from "@/types/enums"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const severityStyles: Record<DiseaseSeverity, string> = {
  [DiseaseSeverity.MILD]: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  [DiseaseSeverity.MODERATE]: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  [DiseaseSeverity.SEVERE]: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  [DiseaseSeverity.CRITICAL]: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
}

const emptyValues: DiseaseFormValues = {
  name: "",
  symptoms: "",
  defaultSeverity: DiseaseSeverity.MODERATE,
  isContagious: false,
  recommendedTreatment: "",
  preventionNotes: "",
}

export function DiseaseManagerDialog({
  open,
  onOpenChange,
  diseases,
  onChanged,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  diseases: DiseaseTableData[]
  onChanged: () => void
}) {
  const [editing, setEditing] = React.useState<DiseaseTableData | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DiseaseFormValues>({
    resolver: zodResolver(diseaseFormSchema),
    defaultValues: emptyValues,
  })

  const isContagious = watch("isContagious")
  const defaultSeverity = watch("defaultSeverity")

  React.useEffect(() => {
    if (!open) return
    setError(null)
    setEditing(null)
    reset(emptyValues)
  }, [open, reset])

  function startEdit(disease: DiseaseTableData) {
    setEditing(disease)
    setError(null)
    reset({
      name: disease.name,
      symptoms: disease.symptoms.join(", "),
      defaultSeverity: disease.defaultSeverity,
      isContagious: disease.isContagious,
      recommendedTreatment: disease.recommendedTreatment ?? "",
      preventionNotes: disease.preventionNotes ?? "",
    })
  }

  async function onSubmit(values: DiseaseFormValues) {
    setSubmitting(true)
    setError(null)

    const result = editing ? await updateDisease(editing.id, values) : await createDisease(values)

    setSubmitting(false)
    if (result.success) {
      setEditing(null)
      reset(emptyValues)
      onChanged()
    } else {
      setError(result.error ?? "Something went wrong.")
    }
  }

  async function handleDelete(disease: DiseaseTableData) {
    const result = await deleteDisease(disease.id)
    if (result.success) {
      onChanged()
    } else {
      setError(result.error ?? "Something went wrong.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Disease catalog</DialogTitle>
          <DialogDescription>
            Manage the diseases health records can link to. Diseases still referenced by a health record
            can't be deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="max-h-80 overflow-y-auto rounded-lg border">
            {diseases.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No diseases yet — add the first one.</p>
            )}
            {diseases.map((d) => (
              <div
                key={d.id}
                className="flex items-start justify-between gap-2 border-b p-3 last:border-b-0 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium text-sm">{d.name}</span>
                    {d.isContagious && <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge variant="secondary" className={severityStyles[d.defaultSeverity]}>
                      {toTitleCase(d.defaultSeverity)}
                    </Badge>
                    {d.recordCount > 0 && (
                      <span className="text-[11px] text-muted-foreground">used in {d.recordCount}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(d)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => void handleDelete(d)}
                    disabled={d.recordCount > 0}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="disease-name">{editing ? "Edit disease" : "New disease"}</Label>
              <Input id="disease-name" placeholder="e.g. Snuffles" {...register("name")} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="symptoms">Symptoms (comma-separated)</Label>
              <Input id="symptoms" placeholder="sneezing, nasal discharge" {...register("symptoms")} />
            </div>

            <div className="grid grid-cols-2 items-end gap-3">
              <div className="grid gap-1.5">
                <Label>Default severity</Label>
                <Select
                  value={defaultSeverity}
                  onValueChange={(v) => setValue("defaultSeverity", v as DiseaseSeverity)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DiseaseSeverity).map((s) => (
                      <SelectItem key={s} value={s}>
                        {toTitleCase(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-1.5">
                <Checkbox
                  id="isContagious"
                  checked={isContagious}
                  onCheckedChange={(v) => setValue("isContagious", !!v)}
                />
                <Label htmlFor="isContagious" className="text-sm font-normal">
                  Contagious
                </Label>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="recommendedTreatment">Recommended treatment</Label>
              <Textarea id="recommendedTreatment" rows={2} {...register("recommendedTreatment")} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="preventionNotes">Prevention notes</Label>
              <Textarea id="preventionNotes" rows={2} {...register("preventionNotes")} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null)
                    reset(emptyValues)
                  }}
                >
                  Cancel edit
                </Button>
              )}
              <Button type="submit" disabled={submitting} className="flex-1">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {submitting ? "Saving…" : editing ? "Save changes" : "Add disease"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
