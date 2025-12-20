// src/database/seed-logs.ts

import { setupDatabase, fetchSeedIds, USER_ID, getRandomInt, daysAgo, getRandomElement, getRandomDate } from './seed-utils';
import { FeedLog, Weight, IFeedLog, IWeight, IRabbit } from '@/database/index';
import { Types } from 'mongoose';

const LOG_DURATION_DAYS = 365;

// --- CORRECTED: Export the function for external API route use ---
export async function seedLogs() {
  await setupDatabase();
  const { cages, feedTypes, bucks, does } = await fetchSeedIds();
  
  // --- 1. Feed Logs (Daily data for 1 year) ---
  await FeedLog.deleteMany({ user_id: USER_ID });
  const feedLogs: Omit<IFeedLog, keyof (IFeedLog)[]>[] = [];
  
  const startDate = daysAgo(LOG_DURATION_DAYS);
  const today = new Date();

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const logDate = new Date(d);
    
    const sampledCages = cages.slice(0, 36); 
    
    for (const cage of sampledCages) {
        const feedType = getRandomElement(feedTypes.filter(f => f.name.includes('Pellets') || f.name.includes('Hay')));
        
        const quantityKg = getRandomInt(1, 5) / 10; 
        const costUsd = quantityKg * feedType.cost_per_kg;

        feedLogs.push({
            feed_type_id: feedType._id as Types.ObjectId,
            log_date: logDate,
            quantity_kg: quantityKg,
            cost_usd: costUsd,
            cage_id: cage._id as Types.ObjectId,
        });
    }
  }

  await FeedLog.insertMany(feedLogs.map(l => ({ ...l, user_id: USER_ID })));
  console.log(`✅ ${feedLogs.length} Feed Logs seeded.`);

  // --- 2. Weight Logs (Simulate intermittent measurements for breeding stock) ---
  await Weight.deleteMany({ user_id: USER_ID });
  const weightLogs: Omit<IWeight, keyof (IWeight)[]>[] = [];

  const sampledRabbits: IRabbit[] = [...bucks.slice(0, 5), ...does.slice(0, 5)]; 

  for (const rabbit of sampledRabbits) {
    // FIX: Check if date_of_birth is defined before calling getRandomDate
    if (!rabbit.date_of_birth) {
      console.warn(`Skipping weight logs for rabbit ${rabbit._id}: date_of_birth is missing.`);
      continue;
    }
    
    // Ensure the start date for logging is after the rabbit's birth date
    const endWindow = daysAgo(30);
    if (rabbit.date_of_birth.getTime() >= endWindow.getTime()) {
        // Rabbit is too young to have been weighed yet (born less than 30 days ago)
        continue; 
    }

    const startLogDate = getRandomDate(rabbit.date_of_birth, endWindow); 
    
    for (let d = new Date(startLogDate); d <= today; d.setDate(d.getDate() + getRandomInt(25, 45))) {
        const measurementDate = new Date(d);
        const ageAtMeasurementDays = Math.ceil(Math.abs(measurementDate.getTime() - rabbit.date_of_birth.getTime()) / (1000 * 60 * 60 * 24));
        
        const weightKg = getRandomInt(45, 65) / 10; 

        weightLogs.push({
            rabbit_id: rabbit._id as Types.ObjectId,
            measurement_date: measurementDate,
            weight_kg: weightKg,
            age_at_measurement_days: ageAtMeasurementDays,
        });
    }
  }

  await Weight.insertMany(weightLogs.map(w => ({ ...w, user_id: USER_ID })));
  console.log(`✅ ${weightLogs.length} Weight Logs seeded for selected stock.`);
}