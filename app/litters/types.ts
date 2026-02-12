// app/litters/types.ts

import { ILitter } from '@/database/index';

/**
 * Interface for the Litter data row as displayed in the table.
 * It combines ILitter with populated Rabbit and Breeding information.
 */
export interface LitterTableData {
  _id: string; // The litter's ID
  breeding_id: string; // The breeding this litter is linked to
  doe_name: string; // doe_id populated name
  buck_name: string; // buck_id populated name
  kindling_date: Date;
  total_kits_born: number;
  kits_surviving: number;
  current_kits_count: number;
  weaning_date: Date | null;
  status: 'Active' | 'Weaned' | 'Closed';
  days_old: number; // Calculated from kindling_date
  survival_rate: number; // Calculated: (kits_surviving / total_kits_born) * 100
}

// Extracted type for the litter status enum
export type LitterStatus = 'Active' | 'Weaned' | 'Closed';
