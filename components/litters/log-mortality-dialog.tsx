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

import { logMortalityAction } from "@/app/litters/actions";
import type { LitterTableData } from "@/app/litters/types";

interface LogMortalityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litter: LitterTableData | null;
  onSaved: () => void;
}

export function LogMortalityDialog({ open, onOpenChange, litter, onSaved }: LogMortalityDialogProps) {
  const [date, setDate] = React.useState("");
  const [count, setCount] = React.useState("1");
  const [cause, setCause] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setDate(new Date().toISOString().slice(0, 10));
    setCount("1");
    setCause("");
    setError(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!litter) return;
    setPending(true);
    setError(null);

    const result = await logMortalityAction({
      litterId: litter.id,
      date: new Date(date) as unknown as Date,
      count: Number(count),
      cause: cause || undefined,
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
            <DialogTitle>Log mortality</DialogTitle>
            <DialogDescription>
              {litter ? `Record kit losses for ${litter.doeName}'s litter.` : "Record kit losses."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mortalityDate">Date</Label>
              <Input id="mortalityDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mortalityCount">Count</Label>
              <Input
                id="mortalityCount"
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mortalityCause">Cause (optional)</Label>
              <Input id="mortalityCause" value={cause} onChange={(e) => setCause(e.target.value)} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Saving…" : "Log mortality"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
