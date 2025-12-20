// --- All Model Exports ---
export * from './breed.model';
export * from './cage.model';
export * from './disease.model';
export * from './feed-type.model';
export * from './feed-log.model';
export * from './rabbit.model';
export * from './weight.model';
export * from './health-record.model';
export * from './litter.model';
export * from './breeding.model';
export * from './schedule.model';
export * from './sale.model';
export * from './expense.model';
export * from './cull.model';
export * from './death.model';
export * from './types'; // Export global types

// --- Explicit Model Imports for Initialization ---
import { Breed } from './breed.model';
import { Cage } from './cage.model';
import { Disease } from './disease.model';
import { FeedType } from './feed-type.model';
import { FeedLog } from './feed-log.model';
import { Rabbit } from './rabbit.model';
import { Weight } from './weight.model';
import { HealthRecord } from './health-record.model';
import { Litter } from './litter.model';
import { Breeding } from './breeding.model';
import { Schedule } from './schedule.model';
import { Sale } from './sale.model';
import { Expense } from './expense.model';
import { Cull } from './cull.model';
import { Death } from './death.model';

/**
 * Helper function for Next.js environments to explicitly load and register all models.
 * This is crucial for environments with hot-reloading to prevent ModelNotRegistered errors.
 */
export function initModels() {
  // Accessing all imported constants ensures their Mongoose model creation logic runs.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
 [
    Breed, Cage, Disease, FeedType, FeedLog, Rabbit, Weight, 
    HealthRecord, Litter, Breeding, Schedule, Sale, Expense, 
    Cull, Death
  ];
  console.log('Successfully initialized all Mongoose models.');
}