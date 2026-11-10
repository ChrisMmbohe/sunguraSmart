"use client";

import { useTransition } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteBreedingAction } from "@/app/breeding/actions";
import type { BreedingTableData } from "@/app/breeding/types";

export function DeleteBreedingDialog({ open, onOpenChange, breeding, onDeleted }: { open: boolean; onOpenChange: (open: boolean) => void; breeding: BreedingTableData | null; onDeleted: () => void }) {
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    if (!breeding) return;
    startTransition(async () => {
      const result = await deleteBreedingAction(breeding.id);
      if (!result.ok) return;
      onOpenChange(false);
      onDeleted();
    });
  }

  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this mating record?</AlertDialogTitle><AlertDialogDescription>{breeding ? `This permanently removes the ${breeding.doeName} x ${breeding.buckName} record and its pending follow-up tasks.` : ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{pending ? "Deleting..." : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
