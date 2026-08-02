'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitDemoRequest, type DemoRequestFormState } from '@/lib/actions/demo-request.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';

const initialState: DemoRequestFormState = { success: false, message: '' };

const FARM_SIZE_OPTIONS = [
  { value: 'under_50', label: 'Under 50 rabbits' },
  { value: '50_200', label: '50 - 200 rabbits' },
  { value: '200_500', label: '200 - 500 rabbits' },
  { value: 'over_500', label: '500+ rabbits' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Sending…' : 'Request a demo'}
    </Button>
  );
}

export function DemoRequestForm() {
  const [state, formAction] = useActionState(submitDemoRequest, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <p className="text-lg font-medium text-card-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" placeholder="Amina Otieno" required />
          {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="amina@farm.co.ke" required />
          {state.errors?.email && <p className="text-sm text-destructive">{state.errors.email[0]}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" placeholder="+254 7xx xxx xxx" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="farmName">Farm name (optional)</Label>
          <Input id="farmName" name="farmName" placeholder="Green Valley Rabbitry" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="farmSize">Farm size</Label>
        <Select name="farmSize">
          <SelectTrigger id="farmSize">
            <SelectValue placeholder="How many rabbits are you managing?" />
          </SelectTrigger>
          <SelectContent>
            {FARM_SIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">What would you like us to cover? (optional)</Label>
        <Textarea id="message" name="message" placeholder="e.g. breeding records, feed costs, multiple cage rows…" rows={4} />
      </div>

      {!state.success && state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <SubmitButton />
    </form>
  );
}
