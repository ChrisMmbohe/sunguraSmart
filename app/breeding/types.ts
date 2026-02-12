// app/breeding/types.ts

import { IBreeding } from '@/database/index';

/**
 * Interface for the Breeding data row as displayed in the table.
 * It combines IBreeding with populated Rabbit (doe and buck) information.
 */
export interface BreedingTableData {
  _id: string; // The breeding's ID
  doe_name: string; // doe_id populated name
  buck_name: string; // buck_id populated name
  mating_date: Date;
  expected_kindling_date: Date;
  is_successful: boolean;
  litter_id: string | null;
  days_since_mating: number; // Calculated
  status: 'Pending' | 'Successful' | 'Failed'; // Derived from is_successful
}

// Extracted type for the breeding success status enum
export type BreedingStatus = 'Pending' | 'Successful' | 'Failed';
