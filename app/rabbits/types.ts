// app/rabbits/types.ts

import { IRabbit, IBreed, ICage } from '@/database/index';

/**
 * Interface for the Rabbit data row as displayed in the table.
 * It combines IRabbit with populated Breed and Cage fields.
 */
export interface RabbitTableData {
  _id: string; // The rabbit's ID
  tag_id: string;
  full_name: string; // Virtual property from IRabbit
  gender: 'Male' | 'Female';
  age_in_days: number; // Virtual property from IRabbit
  maturity_status: IRabbit['maturity_status']; // Virtual property from IRabbit
  status: IRabbit['status'];
  is_pregnant: boolean;

  // Populated fields (from Breed and Cage models)
  breed_name: string; // breed_id.name
  cage_id: string; // cage_id.cage_id
}

// Extracted type for the status enum for convenience in columns.tsx
export type RabbitStatus = IRabbit['status'];