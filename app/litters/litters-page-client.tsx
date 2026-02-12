'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Row } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { LitterForm, LitterFormData } from '@/components/LitterForm';
import { LitterTableData } from './types';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { LitterDetailsModal } from '@/components/LitterDetailsModal';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { IBreedingOption } from '@/lib/data-fetcher';

interface LittersPageClientProps {
  initialLitters: LitterTableData[];
  initialBreedings: IBreedingOption[];
  columns: ColumnDef<LitterTableData>[];
}

export function LittersPageClient({
  initialLitters,
  initialBreedings,
  columns,
}: LittersPageClientProps) {
  const [litters, setLitters] = useState<LitterTableData[]>(initialLitters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLitter, setSelectedLitter] = useState<LitterTableData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFormSubmit = async (data: LitterFormData) => {
    try {
      setSubmitStatus({ type: null, message: '' });
      console.log('Litter data submitted:', data);

      setSubmitStatus({
        type: 'success',
        message: 'Litter recorded successfully! (Note: Backend integration pending.)',
      });

      setIsFormOpen(false);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save litter',
      });
    }
  };

  const handleRowClick = (row: Row<LitterTableData>) => {
    setSelectedLitter(row.original);
    setIsDetailsOpen(true);
  };

  const handleEditLitter = async (data: LitterFormData) => {
    try {
      // API integration would happen here
      console.log('Litter edited:', data);
      setSubmitStatus({
        type: 'success',
        message: 'Litter updated successfully!',
      });
      setIsDetailsOpen(false);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update litter',
      });
    }
  };

  const activeLitters = litters.filter((l) => l.status === 'Active').length;
  const totalKitsBorn = litters.reduce((sum, l) => sum + l.total_kits_born, 0);
  const totalKitsSurviving = litters.reduce((sum, l) => sum + l.kits_surviving, 0);
  const avgSurvivalRate = litters.length > 0 
    ? (litters.reduce((sum, l) => sum + l.survival_rate, 0) / litters.length).toFixed(0)
    : 0;

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
          <p className="text-xs font-medium text-muted-foreground uppercase">Total Litters</p>
          <p className="text-2xl font-bold">{litters.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Active</p>
          <p className="text-2xl font-bold">{activeLitters}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Kits Born</p>
          <p className="text-2xl font-bold">{totalKitsBorn}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase">Avg Survival</p>
          <p className="text-2xl font-bold">{avgSurvivalRate}%</p>
        </div>
      </div>

      {/* Header with Add Button */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Litters</h2>
          <p className="text-sm text-muted-foreground">
            {litters.length} litter{litters.length !== 1 ? 's' : ''} recorded ({totalKitsSurviving} surviving kits)
          </p>
        </div>

        <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Record Litter</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>Record New Litter</SheetTitle>
              <SheetDescription>
                Record a new litter from a breeding event
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <LitterForm
                breedings={initialBreedings}
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
          data={litters}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Details Modal */}
      {selectedLitter && (
        <LitterDetailsModal
          litter={selectedLitter}
          breedings={initialBreedings}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedLitter(null);
          }}
          onEdit={handleEditLitter}
        />
      )}

      {/* Empty State */}
      {litters.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <h3 className="font-semibold text-foreground">No litters yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Record breeding events first, then log litters when kits are born
          </p>
          <Button
            onClick={() => setIsFormOpen(true)}
            variant="outline"
            className="mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            Record Litter
          </Button>
        </div>
      )}
    </div>
  );
}
