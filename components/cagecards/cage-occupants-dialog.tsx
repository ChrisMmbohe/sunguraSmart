"use client"

import * as React from "react"
import { useTransition } from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Gender } from "@/types/enums"
import {
  getCageOccupants,
  getAssignableRabbits,
  assignRabbitToCage,
  vacateRabbit,
} from "@/app/cagecards/actions"
import type { CageCardData, CageOccupant, AssignableRabbitOption } from "@/app/cagecards/types"

export function CageOccupantsDialog({
  open,
  onOpenChange,
  cage,
  onChanged,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cage: CageCardData | null
  /** Called after any successful assign/vacate so the page (and its cards) refresh. */
  onChanged: () => void
}) {
  const [occupants, setOccupants] = React.useState<CageOccupant[]>([])
  const [assignable, setAssignable] = React.useState<AssignableRabbitOption[]>([])
  const [selectedRabbit, setSelectedRabbit] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = React.useCallback(() => {
    if (!cage) return
    setIsLoading(true)
    setError(null)
    Promise.all([getCageOccupants(cage.id), getAssignableRabbits(cage.id)]).then(([occ, assign]) => {
      if (occ.success && occ.data) setOccupants(occ.data)
      else setError(occ.error ?? "Couldn't load occupants.")

      if (assign.success && assign.data) setAssignable(assign.data)

      setIsLoading(false)
    })
  }, [cage])

  React.useEffect(() => {
    if (open && cage) {
      setSelectedRabbit("")
      load()
    }
  }, [open, cage, load])

  function handleAssign() {
    if (!cage || !selectedRabbit) return
    startTransition(async () => {
      const result = await assignRabbitToCage(cage.id, selectedRabbit)
      if (result.success) {
        setSelectedRabbit("")
        load()
        onChanged()
      } else {
        setError(result.error ?? "Couldn't assign that rabbit.")
      }
    })
  }

  function handleVacate(rabbitId: string) {
    startTransition(async () => {
      const result = await vacateRabbit(rabbitId)
      if (result.success) {
        load()
        onChanged()
      } else {
        setError(result.error ?? "Couldn't vacate that rabbit.")
      }
    })
  }

  const atCapacity = cage ? occupants.length >= cage.capacity : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cage?.label}</DialogTitle>
          <DialogDescription>{cage ? `${occupants.length}/${cage.capacity} occupied` : ""}</DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {occupants.length === 0 && (
                <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                  No rabbits assigned to this cage.
                </p>
              )}
              {occupants.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{o.name || o.tagNumber}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      #{o.tagNumber} · {o.breedName} · {o.gender === Gender.MALE ? "Buck" : "Doe"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleVacate(o.id)}
                    disabled={isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="sr-only">Vacate</span>
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Assign a rabbit</span>
                {atCapacity && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  >
                    Full
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedRabbit}
                  onValueChange={setSelectedRabbit}
                  disabled={atCapacity || assignable.length === 0}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={assignable.length === 0 ? "No available rabbits" : "Select a rabbit"} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignable.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                        {r.currentCageLabel ? ` (moving from ${r.currentCageLabel})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!selectedRabbit || isPending || atCapacity}>
                  {isPending ? "…" : "Assign"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
