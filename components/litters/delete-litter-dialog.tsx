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

import { deleteLitterAction } from "@/app/litters/actions";
import type { LitterTableData } from "@/app/litters/types";

interface DeleteLitterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  litter: LitterTableData | null;
  onDeleted: () => void;
}

export function DeleteLitterDialog({ open, onOpenChange, litter, onDeleted }: DeleteLitterDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (open) setError(null);
  }, [open]);

  async function handleDelete() {
    if (!litter) return;
    setPending(true);
    setError(null);

    const result = await deleteLitterAction(litter.id);

    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onDeleted();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete litter?</DialogTitle>
          <DialogDescription>
            {litter
              ? `This permanently removes the litter for ${litter.doeName} × ${litter.buckName} kindled on ${new Date(
                  litter.kindleDate
                ).toLocaleDateString()}. The breeding pair reverts to confirmed-pregnant so it re-enters the due pipeline.`
              : "This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Deleting…" : "Delete litter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
