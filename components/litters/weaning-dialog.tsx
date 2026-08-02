"use client";

import { useEffect, useState } from "react";
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

import { recordWeaningAction } from "@/app/litters/actions";
import type { LitterTableData } from "@/app/litters/types";

const schema = z.object({
  weaningDate: z.string().min(1, "Date is required."),
  kitsWeaned: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

export function WeaningDialog({
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
    defaultValues: { weaningDate: new Date().toISOString().slice(0, 10), kitsWeaned: litter.kitsAlive },
  });

  useEffect(() => {
    if (open) {
      form.reset({ weaningDate: new Date().toISOString().slice(0, 10), kitsWeaned: litter.kitsAlive });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await recordWeaningAction({
        litterId: litter.id,
        weaningDate: new Date(values.weaningDate),
        kitsWeaned: values.kitsWeaned,
      });
      if (result.ok) {
        toast.success("Weaning recorded.");
        onOpenChange(false);
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
          <DialogTitle>Record weaning — {litter.doeName}'s litter</DialogTitle>
          <DialogDescription>
            Defaults to all {litter.kitsAlive} kit{litter.kitsAlive === 1 ? "" : "s"} currently alive. Adjust if not
            all were weaned successfully.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="weaningDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weaning date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kitsWeaned"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kits weaned</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={litter.kitsAlive} {...field} />
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
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record weaning
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
