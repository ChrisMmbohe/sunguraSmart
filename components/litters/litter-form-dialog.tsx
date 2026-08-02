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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createLitterAction, updateLitterAction } from "@/app/litters/actions";
import type { BreedingOption, LitterTableData } from "@/app/litters/types";

interface LitterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breedingOptions: BreedingOption[];
  /** Present -> edit mode. Absent -> create mode. */
  litter?: LitterTableData;
  onSaved: () => void;
}

const emptyForm = {
  breedingId: "",
  kindleDate: "",
  kitsBornAlive: "0",
  kitsBornDead: "0",
  notes: "",
};

export function LitterFormDialog({ open, onOpenChange, breedingOptions, litter, onSaved }: LitterFormDialogProps) {
  const isEdit = !!litter;
  const [form, setForm] = React.useState(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    if (litter) {
      setForm({
        breedingId: litter.breedingId,
        kindleDate: litter.kindleDate.slice(0, 10),
        kitsBornAlive: String(litter.kitsBornAlive),
        kitsBornDead: String(litter.kitsBornDead),
        notes: litter.notes ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, litter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = isEdit
      ? await updateLitterAction({
          litterId: litter!.id,
          kindleDate: new Date(form.kindleDate) as unknown as Date,
          kitsBornAlive: Number(form.kitsBornAlive),
          kitsBornDead: Number(form.kitsBornDead),
          notes: form.notes,
        })
      : await createLitterAction({
          breedingId: form.breedingId,
          kindleDate: new Date(form.kindleDate) as unknown as Date,
          kitsBornAlive: Number(form.kitsBornAlive),
          kitsBornDead: Number(form.kitsBornDead),
          notes: form.notes,
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit litter" : "Record new litter"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the kindling details for this litter."
                : "Log a kindling for a paired or confirmed-pregnant breeding."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="breedingId">Breeding pair</Label>
                <Select
                  value={form.breedingId}
                  onValueChange={(value) => setForm((f) => ({ ...f, breedingId: value }))}
                >
                  <SelectTrigger id="breedingId">
                    <SelectValue placeholder="Select a breeding pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {breedingOptions.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.doeName} × {b.buckName}
                        {b.isOverdue ? " (overdue)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="kindleDate">Kindle date</Label>
              <Input
                id="kindleDate"
                type="date"
                value={form.kindleDate}
                onChange={(e) => setForm((f) => ({ ...f, kindleDate: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kitsBornAlive">Born alive</Label>
                <Input
                  id="kitsBornAlive"
                  type="number"
                  min={0}
                  value={form.kitsBornAlive}
                  onChange={(e) => setForm((f) => ({ ...f, kitsBornAlive: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kitsBornDead">Stillborn</Label>
                <Input
                  id="kitsBornDead"
                  type="number"
                  min={0}
                  value={form.kitsBornDead}
                  onChange={(e) => setForm((f) => ({ ...f, kitsBornDead: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || (!isEdit && !form.breedingId)}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Record litter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
