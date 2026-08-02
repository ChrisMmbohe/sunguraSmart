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
import { logWeight } from "@/app/rabbits/actions"
import type { RabbitTableData } from "@/app/rabbits/types"

export function LogWeightDialog({
  open,
  onOpenChange,
  rabbit,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rabbit: RabbitTableData | null
  onSaved: () => void
}) {
  const [weightKg, setWeightKg] = React.useState("")
  const [recordedAt, setRecordedAt] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  React.useEffect(() => {
    if (open) {
      setWeightKg(rabbit?.currentWeightKg ? String(rabbit.currentWeightKg) : "")
      setRecordedAt(new Date().toISOString().slice(0, 10))
      setNotes("")
      setError(null)
    }
  }, [open, rabbit])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rabbit) return

    startTransition(async () => {
      const result = await logWeight(rabbit.id, { weightKg: Number(weightKg), recordedAt, notes })
      if (result.success) {
        onSaved()
        onOpenChange(false)
      } else {
        setError(result.error ?? "Something went wrong.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log weight</DialogTitle>
          <DialogDescription>
            {rabbit ? `Record a new weight reading for ${rabbit.name || rabbit.tagNumber}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input
              id="weightKg"
              type="number"
              min={0}
              step="0.01"
              value={weightKg}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightKg(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recordedAt">Date</Label>
            <Input id="recordedAt" type="date" value={recordedAt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecordedAt(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weightNotes">Notes</Label>
            <Input id="weightNotes" value={notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !weightKg}>
              {isPending ? "Saving…" : "Log weight"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
