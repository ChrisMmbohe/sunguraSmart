"use client"

import { Printer } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { CageCardData } from "@/app/cage-cards/types"

export function CagePrintDialog({
  open,
  onOpenChange,
  cage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cage: CageCardData | null
}) {
  if (!cage) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm print:max-w-none print:border-0 print:shadow-none">
        {/* Scoped print rule: hide everything else on the page so "Print"
            produces a clean single tag instead of the whole app chrome. */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #cage-print-card, #cage-print-card * { visibility: visible; }
            #cage-print-card { position: fixed; inset: 0; margin: auto; height: fit-content; }
          }
        `}</style>

        <DialogHeader className="print:hidden">
          <DialogTitle>Print cage card</DialogTitle>
        </DialogHeader>

        <div id="cage-print-card" className="space-y-3 rounded-lg border-2 border-dashed p-6 text-center">
          <div className="text-2xl font-bold tracking-tight">{cage.label}</div>
          <div className="text-sm capitalize text-muted-foreground">{cage.type.replace(/_/g, " ")}</div>
          <div className="text-lg font-semibold">Capacity: {cage.capacity}</div>
          {cage.location && <div className="text-sm text-muted-foreground">{cage.location}</div>}

          <div className="mt-4 space-y-1 text-left text-sm">
            {cage.occupants.length === 0 ? (
              <div className="text-center text-muted-foreground">Empty</div>
            ) : (
              cage.occupants.map((o) => (
                <div key={o.id} className="flex justify-between border-b pb-1">
                  <span>{o.name || `#${o.tagNumber}`}</span>
                  <span className="text-muted-foreground">{o.breedName}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-3.5 w-3.5" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
