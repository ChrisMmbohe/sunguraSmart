// app/rabbits/columns.tsx

'use client';

import { ColumnDef } from '@tanstack/react-table';
import { RabbitStatus, RabbitTableData } from './types';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Rabbit as RabbitIcon, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceStrict } from 'date-fns';

// Helper function to get color for status badge
const getStatusVariant = (status: RabbitStatus): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Sold':
      return 'secondary';
    case 'Deceased':
    case 'Culled':
      return 'destructive';
    case 'Sick':
    case 'Quarantined':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const columns: ColumnDef<RabbitTableData>[] = [
  // 1. Tag ID (Main Identifier)
  {
    accessorKey: 'tag_id',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <RabbitIcon className="mr-2 h-4 w-4" />
        Tag ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const tag_id: string = row.getValue('tag_id');
      const name: string = row.original.full_name;
      return (
        <div className="font-medium">
          {tag_id}
          {name !== tag_id && (
            <span className="text-muted-foreground ml-2 text-xs">({name})</span>
          )}
        </div>
      );
    },
  },
  // 2. Breed Name
  {
    accessorKey: 'breed_name',
    header: 'Breed',
  },
  // 3. Gender
  {
    accessorKey: 'gender',
    header: 'Gender',
    cell: ({ row }) => (
      <span className={row.getValue('gender') === 'Male' ? 'text-blue-500' : 'text-pink-500'}>
        {row.getValue('gender')}
      </span>
    ),
  },
  // 4. Age (Calculated from Virtual)
  {
    accessorKey: 'age_in_days',
    header: 'Age',
    cell: ({ row }) => {
      const ageInDays: number = row.getValue('age_in_days');
      // Format the age from days to a human-readable format
      const ageText = formatDistanceStrict(new Date(Date.now() - ageInDays * 86400000), new Date(), {
        unit: 'day',
        roundingMethod: 'floor',
      });
      return <div className="font-mono text-xs">{ageText}</div>;
    },
  },
  // 5. Maturity Status (Virtual)
  {
    accessorKey: 'maturity_status',
    header: 'Stage',
  },
  // 6. Cage ID (Populated)
  {
    accessorKey: 'cage_id',
    header: 'Cage',
  },
  // 7. Status (Badge) - Enhanced with Health Icons
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status: RabbitStatus = row.getValue('status');
      const isHealthIssue = status === 'Sick' || status === 'Quarantined';
      
      return (
        <Badge 
          variant={getStatusVariant(status)} 
          className={`capitalize flex items-center gap-1 w-fit ${
            isHealthIssue ? 'animate-pulse' : ''
          }`}
        >
          {status === 'Quarantined' && <AlertTriangle className="h-3 w-3" />}
          {status === 'Sick' && <Activity className="h-3 w-3" />}
          {status}
          {status === 'Active' && row.original.is_pregnant && (
            <span className="ml-1">🤰</span>
          )}
        </Badge>
      );
    },
  },
];