// app/health/columns.tsx

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { HealthRecordTableData } from './types';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Activity, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// Helper function to get color for status badge
const getStatusVariant = (status: 'Sick' | 'Quarantined' | 'Treated' | 'Resolved'): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'Quarantined':
      return 'destructive';
    case 'Sick':
      return 'destructive';
    case 'Treated':
      return 'secondary';
    case 'Resolved':
      return 'default';
    default:
      return 'outline';
  }
};

export const columns: ColumnDef<HealthRecordTableData>[] = [
  // 1. Rabbit Identifier
  {
    accessorKey: 'rabbit_tag_id',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <Activity className="mr-2 h-4 w-4" />
        Rabbit
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const tag_id: string = row.getValue('rabbit_tag_id');
      const full_name: string = row.original.rabbit_full_name;
      return (
        <div className="font-medium">
          {tag_id}
          {full_name !== tag_id && (
            <span className="text-muted-foreground ml-2 text-xs">({full_name})</span>
          )}
        </div>
      );
    },
  },
  // 2. Disease Name
  {
    accessorKey: 'disease_name',
    header: 'Disease',
    cell: ({ row }) => {
      const disease_name: string = row.getValue('disease_name');
      return <div className="font-medium">{disease_name}</div>;
    },
  },
  // 3. Diagnosis Date
  {
    accessorKey: 'date_of_diagnosis',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Diagnosis Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const diagnosis_date: Date = row.getValue('date_of_diagnosis');
      return (
        <div className="text-sm">
          {format(new Date(diagnosis_date), 'MMM dd, yyyy')}
        </div>
      );
    },
  },
  // 4. Treatment Period
  {
    accessorKey: 'treatment_start_date',
    header: 'Treatment Period',
    cell: ({ row }) => {
      const start_date: Date = row.getValue('treatment_start_date');
      const end_date: Date | null = row.original.treatment_end_date;
      return (
        <div className="text-sm">
          {format(new Date(start_date), 'MMM dd')}
          {end_date ? ` - ${format(new Date(end_date), 'MMM dd')}` : ' - Ongoing'}
        </div>
      );
    },
  },
  // 5. Status
  {
    accessorKey: 'current_status',
    header: 'Status',
    cell: ({ row }) => {
      const status: 'Sick' | 'Quarantined' | 'Treated' | 'Resolved' = row.getValue('current_status');
      return (
        <Badge variant={getStatusVariant(status)} className="capitalize flex items-center gap-1 w-fit">
          {status === 'Quarantined' && <AlertTriangle className="h-3 w-3" />}
          {status}
        </Badge>
      );
    },
  },
  // 6. Quarantined Indicator
  {
    accessorKey: 'quarantined',
    header: 'Quarantine',
    cell: ({ row }) => {
      const is_quarantined: boolean = row.getValue('quarantined');
      return (
        <div className="text-sm">
          {is_quarantined ? (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Yes
            </span>
          ) : (
            <span className="text-muted-foreground">No</span>
          )}
        </div>
      );
    },
  },
  // 7. Days Since Diagnosis
  {
    accessorKey: 'days_since_diagnosis',
    header: 'Days Since',
    cell: ({ row }) => {
      const days: number = row.getValue('days_since_diagnosis');
      return (
        <div className="font-mono text-xs">
          {days}d
        </div>
      );
    },
  },
  // 8. Notes (truncated)
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => {
      const notes: string | null = row.getValue('notes');
      if (!notes) return <span className="text-muted-foreground text-xs">-</span>;
      return (
        <div className="text-xs max-w-xs truncate" title={notes}>
          {notes}
        </div>
      );
    },
  },
];
