/**
 * Single entry point for the whole data layer.
 *
 * Usage:
 *   import { dbConnect, Rabbit, Breeding, Litter } from '@/database';
 *
 * Import this barrel (rather than individual model files) wherever
 * possible so every model gets registered with Mongoose exactly once,
 * even across Next.js API routes / server actions that may be bundled
 * separately.
 */

export { dbConnect } from './connection';

export * from '../types/enums';

export { User } from './models/User.model';
export type { IUser } from './models/User.model';

export { Breed } from './models/Breed_model';
export type { IBreed } from './models/Breed_model';

export { Cage } from './models/Cage_model';
export type { ICage } from './models/Cage_model';

export { Rabbit } from './models/Rabbit_model';
export type { IRabbit, IRabbitModel } from './models/Rabbit_model';

export { WeightLog } from './models/WeightLog_model';
export type { IWeightLog } from './models/WeightLog_model';

export { Breeding } from './models/Breeding_model';
export type { IBreeding, IBreedingModel } from './models/Breeding_model';

export { Litter } from './models/Litter_model';
export type { ILitter, ILitterModel, IMortalityEvent } from './models/Litter_model';

export { FeedType } from './models/FeedType_model';
export type { IFeedType } from './models/FeedType_model';

export { FeedLog } from './models/FeedLog_model';
export type { IFeedLog, IFeedLogModel } from './models/FeedLog_model';

export { Disease } from './models/Disease_model';
export type { IDisease } from './models/Disease_model';

export { HealthRecord } from './models/HealthRecord_model';
export type { IHealthRecord, IHealthRecordModel } from './models/HealthRecord_model';

export { Schedule } from './models/Schedule_model';
export type { ISchedule, IScheduleModel, IScheduleRecurrence } from './models/Schedule_model';

export { Sale } from './models/Sale_model';
export type { ISale, ISaleModel } from './models/Sale_model';

export { Expense } from './models/Expense_model';
export type { IExpense, IExpenseModel } from './models/Expense_model';

export { DemoRequest, DemoRequestStatus, FarmSizeRange } from './models/DemoRequest_model';
export type { IDemoRequest } from './models/DemoRequest_model';
