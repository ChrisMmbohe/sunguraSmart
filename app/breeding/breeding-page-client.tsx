'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Row } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { BreedingForm, BreedingFormData } from '@/components/BreedingForm';
import { BreedingTableData } from './types';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { BreedingDetailsModal } from '@/components/BreedingDetailsModal';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { IRabbitOption } from '@/lib/data-fetcher';

interface BreedingPageClientProps {
  initialBreedings: BreedingTableData[];
  initialRabbits: IRabbitOption[];
  columns: ColumnDef<BreedingTableData>[];
}

export function BreedingPageClient({
  initialBreedings,
  initialRabbits,
  columns,
}: BreedingPageClientProps) {
  const [breedings, setBreedings] = useState<BreedingTableData[]>(initialBreedings);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBreeding, setSelectedBreeding] = useState<BreedingTableData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFormSubmit = async (data: BreedingFormData) => {
    try {
      setSubmitStatus({ type: null, message: '' });
      console.log('Breeding data submitted:', data);

      setSubmitStatus({
        type: 'success',
        message: 'Breeding recorded successfully! (Note: Backend integration pending.)',
      });

      setIsFormOpen(false);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save breeding',
      });
    }
  };

  const handleRowClick = (row: Row<BreedingTableData>) => {
    setSelectedBreeding(row.original);
    setIsDetailsOpen(true);
  };

  const handleEditBreeding = async (data: BreedingFormData) => {
    try {
      // API integration would happen here
      console.log('Breeding edited:', data);
      setSubmitStatus({
        type: 'success',
        message: 'Breeding updated successfully!',
      });
      setIsDetailsOpen(false);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update breeding',
      });
    }
  };

  const successfulCount = breedings.filter((b) => b.is_successful).length;
  const pendingCount = breedings.filter((b) => b.status === 'Pending').length;
  const kindlingRate = breedings.length > 0 ? ((successfulCount / breedings.length) * 100).toFixed(0) : 0;

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

      {/* Summary Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Total Breedings</p>
          <p className="text-2xl font-bold">{breedings.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Successful</p>
          <p className="text-2xl font-bold">{successfulCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Pending</p>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Kindling Rate</p>
          <p className="text-2xl font-bold">{kindlingRate}%</p>
        </div>
      </div>

      {/* Header with Add Button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Breeding Events</h2>
          <p className="text-sm text-muted-foreground">
            {breedings.length} breeding{breedings.length !== 1 ? 's' : ''} recorded
          </p>
        </div>

        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Record Breeding</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>Record New Breeding</SheetTitle>
              <SheetDescription>
                Record a new breeding event between a doe and buck
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <BreedingForm
                rabbits={initialRabbits}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-border">
        <DataTable
          columns={columns}
          data={breedings}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Details Modal */}
      {selectedBreeding && (
        <BreedingDetailsModal
          breeding={selectedBreeding}
          rabbits={initialRabbits}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedBreeding(null);
          }}
          onEdit={handleEditBreeding}
        />
      )}

      {/* Empty State */}
      {breedings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <h3 className="font-semibold text-foreground">No breeding events yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start tracking breeding events to improve your farm management
          </p>
          <Button
            onClick={() => setIsFormOpen(true)}
            variant="outline"
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            Record Breeding
          </Button>
        </div>
      )}
    </div>
  );
}
