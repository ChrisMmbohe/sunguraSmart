"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { recordWeaningAction } from "@/app/litters/actions";
import type { LitterTableData } from "@/app/litters/types";

interface RecordWeaningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litter: LitterTableData | null;
  onSaved: () => void;
}

export function RecordWeaningDialog({ open, onOpenChange, litter, onSaved }: RecordWeaningDialogProps) {
  const [weaningDate, setWeaningDate] = React.useState("");
  const [kitsWeaned, setKitsWeaned] = React.useState("0");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!open || !litter) return;
    setWeaningDate(new Date().toISOString().slice(0, 10));
    // Default to "everyone still alive" — the farmer can lower it if needed.
    setKitsWeaned(String(litter.kitsAlive));
    setError(null);
  }, [open, litter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!litter) return;
    setPending(true);
    setError(null);

    const result = await recordWeaningAction({
      litterId: litter.id,
      weaningDate: new Date(weaningDate) as unknown as Date,
      kitsWeaned: Number(kitsWeaned),
    });

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record weaning</DialogTitle>
            <DialogDescription>
              {litter ? `Mark ${litter.doeName}'s litter as weaned.` : "Mark this litter as weaned."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="weaningDate">Weaning date</Label>
              <Input
                id="weaningDate"
                type="date"
                value={weaningDate}
                onChange={(e) => setWeaningDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kitsWeaned">Kits weaned</Label>
              <Input
                id="kitsWeaned"
                type="number"
                min={0}
                value={kitsWeaned}
                onChange={(e) => setKitsWeaned(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Record weaning"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
