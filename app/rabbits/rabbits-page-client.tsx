'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { RabbitForm, RabbitFormData } from '@/components/RabbitForm';
import { RabbitTableData } from './types';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { IBreedOption, ICageOption } from '@/lib/data-fetcher';

interface RabbitsPageClientProps {
  initialRabbits: RabbitTableData[];
  initialBreeds: IBreedOption[];
  initialCages: ICageOption[];
  columns: ColumnDef<RabbitTableData>[];
}

export function RabbitsPageClient({
  initialRabbits,
  initialBreeds,
  initialCages,
  columns,
}: RabbitsPageClientProps) {
  const [rabbits] = useState<RabbitTableData[]>(initialRabbits);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFormSubmit = async (data: RabbitFormData) => {
    try {
      setSubmitStatus({ type: null, message: '' });

      // TODO: Replace with actual API call to submit the form
      // For now, we're just showing that the form is ready for backend integration
      console.log('Form data submitted:', data);

      // Simulate an optimistic update (in a real app, you'd wait for the API response)
      // and then refetch the data or update the local state based on the API response.

      setSubmitStatus({
        type: 'success',
        message: 'Rabbit saved successfully! (Note: This is frontend-only. Backend integration pending.)',
      });

      setIsFormOpen(false);

      // Optionally, you could refetch the rabbits data here:
      // const updated = await getRabbitsForTable();
      // setRabbits(updated);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save rabbit',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {submitStatus.type && (
        <div
          className={`flex gap-2 rounded-lg border p-3 text-sm ${
            submitStatus.type === 'success'
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-red-300 bg-red-50 text-red-700'
          }`}
        >
          {submitStatus.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{submitStatus.message}</span>
          <button
            onClick={() => setSubmitStatus({ type: null, message: '' })}
            className="ml-auto text-sm font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header with Add Button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rabbits</h2>
          <p className="text-sm text-muted-foreground">
            {rabbits.length} rabbit{rabbits.length !== 1 ? 's' : ''} in your farm
          </p>
        </div>

        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Rabbit</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>Add New Rabbit</SheetTitle>
              <SheetDescription>
                Fill in the form below to register a new rabbit in your farm
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <RabbitForm
                breeds={initialBreeds}
                cages={initialCages}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Data Table with Modal Details */}
      <div className="rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={rabbits}
        />
      </div>

      {/* Empty State */}
      {rabbits.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <h3 className="font-semibold text-foreground">No rabbits yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first rabbit to the farm
          </p>
          <Button
            onClick={() => setIsFormOpen(true)}
            variant="outline"
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Rabbit
          </Button>
        </div>
      )}
    </div>
  );
}
