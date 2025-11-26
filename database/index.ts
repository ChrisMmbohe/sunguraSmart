import Breed from './breed.model';
import Breeding from './breeding.model';
import Cage from './cage.model';
import Cull from './cull.model';
import Death from './death.model';
import Disease from './disease.model';
import Expense from './expense.model';
import FeedLog from './feed-log.model';
import FeedType from './feed-type.model';
import HealthRecord from './health-record.model';
import Litter from './litter.model';
import Rabbit from './rabbit.model';
import Sale from './sale.model';
import Schedule from './schedule.model';
import Weight from './weight.model';

/**
 * 💡 FIX: Explicitly exports the initModels function.
 * This function is called by connectDB (in mongodb.ts) to guarantee all models 
 * are registered (by forcing module execution) before Mongoose operations begin, 
 * preventing "OverwriteModelError".
 */
export function initModels() {
  // Accessing the imported models ensures their module code (with mongoose.model()) runs.
  void Breed;
  void Breeding;
  void Cage;
  void Cull;
  void Death;
  void Disease;
  void Expense;
  void FeedLog;
  void FeedType;
  void HealthRecord;
  void Litter;
  void Rabbit;
  void Sale;
  void Schedule;
  void Weight;
}

// Re-export all models using named exports for single import access across the application
export { 
    Breed,
    Breeding,
    Cage,
    Cull,
    Death,
    Disease,
    Expense,
    FeedLog,
    FeedType,
    HealthRecord,
    Litter,
    Rabbit,
    Sale,
    Schedule,
    Weight
};

// Export interfaces for type safety (this section remains the same)
export type { IBreed } from './breed.model';
export type { IBreeding } from './breeding.model';
export type { ICage } from './cage.model';
export type { ICull } from './cull.model';
export type { IDeath } from './death.model';
export type { IDisease } from './disease.model';
export type { IExpense } from './expense.model';
export type { IFeedLog } from './feed-log.model';
export type { IFeedType } from './feed-type.model';
export type { IHealthRecord } from './health-record.model';
export type { ILitter } from './litter.model';
export type { IRabbit } from './rabbit.model';
export type { ISale } from './sale.model';
export type { ISchedule } from './schedule.model';
export type { IWeight } from './weight.model';