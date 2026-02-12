// app/health/types.ts

import { IHealthRecord, IDisease, IRabbit } from '@/database/index';

/**
 * Interface for the Health Record data row as displayed in the table.
 * It combines IHealthRecord with populated Rabbit and Disease fields.
 */
export interface HealthRecordTableData {
  _id: string; // The health record's ID
  rabbit_id: string; // The rabbit's ID
  rabbit_tag_id: string; // Rabbit ear_tag_id
  rabbit_full_name: string; // Rabbit full name (tag or tag - name)
  disease_id: string; // The disease's ID
  disease_name: string; // Disease name
  date_of_diagnosis: Date;
  treatment_start_date: Date;
  treatment_end_date: Date | null;
  quarantined: boolean;
  notes: string | null;
  // Derived fields
  is_active: boolean; // true if treatment_end_date is null
  current_status: 'Sick' | 'Quarantined' | 'Treated' | 'Resolved';
  days_since_diagnosis: number;
  treatment_duration_days: number | null; // null if ongoing
}
