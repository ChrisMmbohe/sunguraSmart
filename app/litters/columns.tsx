// app/litters/columns.tsx

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { LitterTableData, LitterStatus } from './types';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Calendar, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// Helper function to get color for status badge
const getStatusVariant = (status: LitterStatus): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Weaned':
      return 'secondary';
    case 'Closed':
      return 'outline';
    default:
      return 'outline';
  }
};

// Helper function to get survival rate color
const getSurvivalRateColor = (survivalRate: number): string => {
  if (survivalRate >= 90) return 'text-green-600';
  if (survivalRate >= 70) return 'text-amber-600';
  return 'text-red-600';
};

export const columns: ColumnDef<LitterTableData>[] = [
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
  // 3. Kindling Date
  {
    accessorKey: 'kindling_date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <Calendar className="mr-2 h-4 w-4" />
        Kindling Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const kindling_date: Date = row.getValue('kindling_date');
      return (
        <div className="text-sm">
          {format(new Date(kindling_date), 'MMM dd, yyyy')}
        </div>
      );
    },
  },
  // 4. Total Kits Born
  {
    accessorKey: 'total_kits_born',
    header: 'Born',
    cell: ({ row }) => {
      const total: number = row.getValue('total_kits_born');
      return <div className="font-mono text-center font-bold">{total}</div>;
    },
  },
  // 5. Kits Surviving
  {
    accessorKey: 'kits_surviving',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <Heart className="mr-2 h-4 w-4" />
        Surviving
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const surviving: number = row.getValue('kits_surviving');
      return <div className="font-mono text-center font-bold">{surviving}</div>;
    },
  },
  // 6. Survival Rate
  {
    accessorKey: 'survival_rate',
    header: 'Survival Rate',
    cell: ({ row }) => {
      const rate: number = row.getValue('survival_rate');
      return (
        <div className={`font-mono text-sm font-semibold ${getSurvivalRateColor(rate)}`}>
          {rate.toFixed(0)}%
        </div>
      );
    },
  },
  // 7. Age (Days Old)
  {
    accessorKey: 'days_old',
    header: 'Age',
    cell: ({ row }) => {
      const days: number = row.getValue('days_old');
      return <div className="font-mono text-xs">{days}d</div>;
    },
  },
  // 8. Status (Badge)
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status: LitterStatus = row.getValue('status');
      return (
        <Badge variant={getStatusVariant(status)} className="capitalize">
          {status}
        </Badge>
      );
    },
  },
];
