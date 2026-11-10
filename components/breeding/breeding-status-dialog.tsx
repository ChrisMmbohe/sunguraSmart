"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateBreedingStatusAction } from "@/app/breeding/actions";
import { BreedingStatus } from "@/types/enums";
import type { BreedingTableData } from "@/app/breeding/types";

export function BreedingStatusDialog({ open, onOpenChange, breeding, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; breeding: BreedingTableData | null; onSaved: () => void }) {
  const [status, setStatus] = React.useState<BreedingStatus>(BreedingStatus.CONFIRMED_PREGNANT);
  const [statusDate, setStatusDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [failureReason, setFailureReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setStatus(BreedingStatus.CONFIRMED_PREGNANT);
      setStatusDate(new Date().toISOString().slice(0, 10));
      setFailureReason("");
      setError(null);
    }
  }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!breeding) return;
    setPending(true);
    setError(null);
    const result = await updateBreedingStatusAction({ breedingId: breeding.id, status: status as BreedingStatus.CONFIRMED_PREGNANT | BreedingStatus.FAILED | BreedingStatus.ABORTED, statusDate: new Date(statusDate), failureReason });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSaved();
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><form onSubmit={submit}><DialogHeader><DialogTitle>Update breeding outcome</DialogTitle><DialogDescription>{breeding ? `${breeding.doeName} x ${breeding.buckName}` : "Resolve this breeding record."}</DialogDescription></DialogHeader><div className="grid gap-4 py-4">
    <div className="grid gap-2"><Label htmlFor="breedingStatus">New status</Label><Select value={status} onValueChange={(value) => setStatus(value as BreedingStatus)}><SelectTrigger id="breedingStatus"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={BreedingStatus.CONFIRMED_PREGNANT}>Confirmed pregnant</SelectItem><SelectItem value={BreedingStatus.FAILED}>Failed</SelectItem><SelectItem value={BreedingStatus.ABORTED}>Aborted</SelectItem></SelectContent></Select></div>
    <div className="grid gap-2"><Label htmlFor="statusDate">Date</Label><Input id="statusDate" type="date" value={statusDate} onChange={(event) => setStatusDate(event.target.value)} required /></div>
    {status !== BreedingStatus.CONFIRMED_PREGNANT && <div className="grid gap-2"><Label htmlFor="failureReason">Reason</Label><Textarea id="failureReason" value={failureReason} onChange={(event) => setFailureReason(event.target.value)} placeholder="e.g. no pregnancy observed" rows={3} required /></div>}
    {error && <p className="text-sm text-red-600">{error}</p>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save status"}</Button></DialogFooter></form></DialogContent></Dialog>;
}