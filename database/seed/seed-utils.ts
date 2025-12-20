// src/database/seed-utils.ts

import connectDB from '@/lib/mongodb';
import { Types } from 'mongoose';
import { 
  initModels, Breed, Cage, Rabbit, FeedType, Disease, IBreed, ICage, IFeedType, IDisease, IRabbit, 
  FeedLog, Weight, HealthRecord, Litter, Breeding, Schedule, Sale, Expense, Cull, Death // Added for clearDatabase
} from '@/database/index';

// --- CONFIGURATION ---
export const USER_ID = 'user_clerk_test_12345'; // Consistent user ID for all seeded documents
export const INITIAL_STOCK_COUNT = 100; // Total rabbits to start with

// --- UTILITIES ---

/**
 * Ensures DB connection and model initialization before seeding.
 */
export async function setupDatabase() {
  await connectDB();
  initModels();
  console.log('Database connected and models initialized.');
}

/**
 * Clears all seeded data for the specified USER_ID from all models.
 * This is crucial for idempotent seeding.
 */
export async function clearDatabase() {
  console.log('--- 🗑️ Clearing existing data for USER_ID:', USER_ID, '...');

  // Grouped models by dependency level (optional) or simply by function
  const deletionPromises = [
    // Core/Dependent Entities
    Rabbit.deleteMany({ user_id: USER_ID }),
    FeedLog.deleteMany({ user_id: USER_ID }),
    Weight.deleteMany({ user_id: USER_ID }),
    HealthRecord.deleteMany({ user_id: USER_ID }),
    Litter.deleteMany({ user_id: USER_ID }),
    Breeding.deleteMany({ user_id: USER_ID }),
    Schedule.deleteMany({ user_id: USER_ID }),
    Sale.deleteMany({ user_id: USER_ID }),
    Expense.deleteMany({ user_id: USER_ID }),
    Cull.deleteMany({ user_id: USER_ID }),
    Death.deleteMany({ user_id: USER_ID }),
    // Metadata / Parent Entities
    Breed.deleteMany({ user_id: USER_ID }),
    Cage.deleteMany({ user_id: USER_ID }),
    FeedType.deleteMany({ user_id: USER_ID }),
    Disease.deleteMany({ user_id: USER_ID }),
  ];

  await Promise.all(deletionPromises);
  console.log('--- ✅ All existing data cleared.');
}

/**
 * Simple random integer generator.
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random element from an array.
 */
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns a random date between two dates.
 */
export function getRandomDate(start: Date, end: Date): Date {
  const diff = end.getTime() - start.getTime();
  const newDate = new Date(start.getTime() + Math.random() * diff);
  
  // Truncate time to ensure consistency (optional, but good for seeds)
  newDate.setHours(0, 0, 0, 0); 
  return newDate;
}

/**
 * Returns a date 'days' ago.
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Converts days to a Date object relative to a start date.
 */
export function daysFrom(startDate: Date, days: number): Date {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Fetches essential metadata IDs for subsequent seeding steps.
 */
export interface SeedIds {
  breeds: IBreed[];
  cages: ICage[];
  feedTypes: IFeedType[];
  diseases: IDisease[];
  bucks: IRabbit[];
  does: IRabbit[];
}

export async function fetchSeedIds(): Promise<SeedIds> {
  const breeds = await Breed.find({ user_id: USER_ID }).lean();
  const cages = await Cage.find({ user_id: USER_ID }).lean();
  const feedTypes = await FeedType.find({ user_id: USER_ID }).lean();
  const diseases = await Disease.find({ user_id: USER_ID }).lean();
  
  // Fetch a sample of Active Bucks and Does for breeding simulations
  const activeRabbits = await Rabbit.find({ user_id: USER_ID, status: 'Active' })
    .select('gender')
    .lean();

  const bucks = activeRabbits.filter(r => r.gender === 'Male') as IRabbit[];
  const does = activeRabbits.filter(r => r.gender === 'Female') as IRabbit[];

  return {
    breeds,
    cages,
    feedTypes,
    diseases,
    bucks,
    does,
  };
}