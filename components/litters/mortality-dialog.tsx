"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { logMortalityAction } from "@/app/litters/actions";
import type { LitterTableData } from "@/app/litters/types";

const schema = z.object({
  date: z.string().min(1, "Date is required."),
  count: z.coerce.number().int().min(1, "Must log at least 1 kit."),
  cause: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function MortalityDialog({
  litter,
  open,
  onOpenChange,
}: {
  litter: LitterTableData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().slice(0, 10), count: 1, cause: "" },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await logMortalityAction({
        litterId: litter.id,
        date: new Date(values.date),
        count: values.count,
        cause: values.cause,
      });
      if (result.ok) {
        toast.success("Mortality event logged.");
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Log mortality — {litter.doeName}'s litter</DialogTitle>
          <DialogDescription>
            {litter.kitsAlive} kit{litter.kitsAlive === 1 ? "" : "s"} currently alive in this litter.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number lost</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={litter.kitsAlive} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cause (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. chilling, crushing, illness" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log mortality
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
