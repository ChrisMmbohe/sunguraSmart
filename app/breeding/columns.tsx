// app/breeding/columns.tsx

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { BreedingTableData, BreedingStatus } from './types';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// Helper function to get color for status badge
const getStatusVariant = (status: BreedingStatus): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'Successful':
      return 'default';
    case 'Pending':
      return 'outline';
    case 'Failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const columns: ColumnDef<BreedingTableData>[] = [
  // 1. Doe Name
  {
    accessorKey: 'doe_name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <Users className="mr-2 h-4 w-4" />
        Doe
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const doe_name: string = row.getValue('doe_name');
      return <div className="font-medium">{doe_name}</div>;
    },
  },
  // 2. Buck Name
  {
    accessorKey: 'buck_name',
    header: 'Buck',
    cell: ({ row }) => {
      const buck_name: string = row.getValue('buck_name');
      return <div className="font-medium">{buck_name}</div>;
    },
  },
  // 3. Mating Date
  {
    accessorKey: 'mating_date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Mating Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const mating_date: Date = row.getValue('mating_date');
      return (
        <div className="text-sm">
          {format(new Date(mating_date), 'MMM dd, yyyy')}
        </div>
      );
    },
  },
  // 4. Expected Kindling Date
  {
    accessorKey: 'expected_kindling_date',
    header: 'Expected Kindling',
    cell: ({ row }) => {
      const expected_kindling_date: Date = row.getValue('expected_kindling_date');
      return (
        <div className="text-sm">
          {format(new Date(expected_kindling_date), 'MMM dd, yyyy')}
        </div>
      );
    },
  },
  // 5. Days Since Mating
  {
    accessorKey: 'days_since_mating',
    header: 'Days Since',
    cell: ({ row }) => {
      const days: number = row.getValue('days_since_mating');
      return (
        <div className="font-mono text-xs">
          {days}d
        </div>
      );
    },
  },
  // 6. Status (Badge)
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status: BreedingStatus = row.getValue('status');
      return (
        <Badge variant={getStatusVariant(status)} className="capitalize">
          {status}
        </Badge>
      );
    },
  },
  // 7. Litter Status
  {
    accessorKey: 'litter_id',
    header: 'Litter',
    cell: ({ row }) => {
      const litter_id: string | null = row.getValue('litter_id');
      return litter_id ? (
        <Badge variant="secondary" className="text-xs">
          Linked
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">No Litter</span>
      );
    },
  },
];
