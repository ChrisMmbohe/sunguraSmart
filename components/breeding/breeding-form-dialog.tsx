"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBreedingAction, updateBreedingAction } from "@/app/breeding/actions";
import { BreedingMethod } from "@/types/enums";
import type { BreedingOption, BreedingTableData } from "@/app/breeding/types";

export function BreedingFormDialog({ open, onOpenChange, options, breeding, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; options: { does: BreedingOption[]; bucks: BreedingOption[] }; breeding?: BreedingTableData; onSaved: () => void }) {
  const isEditing = Boolean(breeding);
  const [form, setForm] = React.useState({ doeId: breeding?.doeId ?? "", buckId: breeding?.buckId ?? "", method: breeding?.method ?? BreedingMethod.NATURAL, pairedDate: breeding?.pairedDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10), notes: breeding?.notes ?? "" });
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  React.useEffect(() => { if (open) { setError(null); setForm({ doeId: breeding?.doeId ?? "", buckId: breeding?.buckId ?? "", method: breeding?.method ?? BreedingMethod.NATURAL, pairedDate: breeding?.pairedDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10), notes: breeding?.notes ?? "" }); } }, [open, breeding]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError(null);
    const result = isEditing && breeding ? await updateBreedingAction({ ...form, breedingId: breeding.id, pairedDate: new Date(form.pairedDate) }) : await createBreedingAction({ ...form, pairedDate: new Date(form.pairedDate) });
    setPending(false);
    if (!result.ok) { setError(result.error); return; }
    onOpenChange(false); onSaved();
  }
  const does = options.does.some((option) => option.id === form.doeId) || !breeding ? options.does : [{ id: breeding.doeId, name: breeding.doeName, tagNumber: breeding.doeTagNumber }, ...options.does];
  const bucks = options.bucks.some((option) => option.id === form.buckId) || !breeding ? options.bucks : [{ id: breeding.buckId, name: breeding.buckName, tagNumber: breeding.buckTagNumber }, ...options.bucks];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><form onSubmit={submit}><DialogHeader><DialogTitle>{isEditing ? "Edit mating record" : "Record mating"}</DialogTitle><DialogDescription>{isEditing ? "Update the mating details and notes." : "Capture a mating attempt. The due date is calculated from the doe&apos;s breed."}</DialogDescription></DialogHeader><div className="grid gap-4 py-4">
    <div className="grid gap-2"><Label htmlFor="doeId">Dam / doe</Label><Select value={form.doeId} onValueChange={(value) => setForm((current) => ({ ...current, doeId: value }))}><SelectTrigger id="doeId"><SelectValue placeholder="Select an active doe" /></SelectTrigger><SelectContent>{does.map((option) => <SelectItem key={option.id} value={option.id}>{option.name ? `${option.name} (${option.tagNumber})` : option.tagNumber}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid gap-2"><Label htmlFor="buckId">Sire / buck</Label><Select value={form.buckId} onValueChange={(value) => setForm((current) => ({ ...current, buckId: value }))}><SelectTrigger id="buckId"><SelectValue placeholder="Select an active buck" /></SelectTrigger><SelectContent>{bucks.map((option) => <SelectItem key={option.id} value={option.id}>{option.name ? `${option.name} (${option.tagNumber})` : option.tagNumber}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="pairedDate">Mating date</Label><Input id="pairedDate" type="date" value={form.pairedDate} onChange={(event) => setForm((current) => ({ ...current, pairedDate: event.target.value }))} required /></div><div className="grid gap-2"><Label htmlFor="method">Method</Label><Select value={form.method} onValueChange={(value) => setForm((current) => ({ ...current, method: value as BreedingMethod }))}><SelectTrigger id="method"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={BreedingMethod.NATURAL}>Natural</SelectItem><SelectItem value={BreedingMethod.ARTIFICIAL_INSEMINATION}>Artificial insemination</SelectItem></SelectContent></Select></div></div>
    <div className="grid gap-2"><Label htmlFor="breedingNotes">Notes</Label><Textarea id="breedingNotes" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} /></div>{error && <p className="text-sm text-red-600">{error}</p>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? "Saving..." : isEditing ? "Save changes" : "Record mating"}</Button></DialogFooter></form></DialogContent></Dialog>;
}