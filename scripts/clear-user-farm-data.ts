/**
 * Remove all tenant-owned data for one Clerk user and farm.
 *
 * This is a dry run by default. The exact user and farm name must both match
 * the User document before any tenant data can be removed.
 *
 * Usage:
 *   npx tsx scripts/clear-user-farm-data.ts --user=<clerkUserId> --farm=<farmName>
 *   npx tsx scripts/clear-user-farm-data.ts --user=<clerkUserId> --farm=<farmName> --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

import { Breed } from '../database/models/Breed_model';
import { Breeding } from '../database/models/Breeding_model';
import { Cage } from '../database/models/Cage_model';
import { Disease } from '../database/models/Disease_model';
import { Expense } from '../database/models/Expense_model';
import { FeedLog } from '../database/models/FeedLog_model';
import { FeedType } from '../database/models/FeedType_model';
import { HealthRecord } from '../database/models/HealthRecord_model';
import { Litter } from '../database/models/Litter_model';
import { Rabbit } from '../database/models/Rabbit_model';
import { Sale } from '../database/models/Sale_model';
import { Schedule } from '../database/models/Schedule_model';
import { User } from '../database/models/User.model';
import { WeightLog } from '../database/models/WeightLog_model';

type TenantFilter = { userId: string };

interface TenantCollection {
  name: string;
  count: (filter: TenantFilter) => PromiseLike<number>;
  remove: (filter: TenantFilter) => PromiseLike<{ deletedCount?: number }>;
}

const tenantCollections: TenantCollection[] = [
  { name: 'WeightLog', count: (filter) => WeightLog.countDocuments(filter), remove: (filter) => WeightLog.deleteMany(filter) },
  { name: 'HealthRecord', count: (filter) => HealthRecord.countDocuments(filter), remove: (filter) => HealthRecord.deleteMany(filter) },
  { name: 'FeedLog', count: (filter) => FeedLog.countDocuments(filter), remove: (filter) => FeedLog.deleteMany(filter) },
  { name: 'Schedule', count: (filter) => Schedule.countDocuments(filter), remove: (filter) => Schedule.deleteMany(filter) },
  { name: 'Sale', count: (filter) => Sale.countDocuments(filter), remove: (filter) => Sale.deleteMany(filter) },
  { name: 'Expense', count: (filter) => Expense.countDocuments(filter), remove: (filter) => Expense.deleteMany(filter) },
  { name: 'Litter', count: (filter) => Litter.countDocuments(filter), remove: (filter) => Litter.deleteMany(filter) },
  { name: 'Breeding', count: (filter) => Breeding.countDocuments(filter), remove: (filter) => Breeding.deleteMany(filter) },
  { name: 'Rabbit', count: (filter) => Rabbit.countDocuments(filter), remove: (filter) => Rabbit.deleteMany(filter) },
  { name: 'Cage', count: (filter) => Cage.countDocuments(filter), remove: (filter) => Cage.deleteMany(filter) },
  { name: 'Disease', count: (filter) => Disease.countDocuments(filter), remove: (filter) => Disease.deleteMany(filter) },
  { name: 'FeedType', count: (filter) => FeedType.countDocuments(filter), remove: (filter) => FeedType.deleteMany(filter) },
  { name: 'Breed', count: (filter) => Breed.countDocuments(filter), remove: (filter) => Breed.deleteMany(filter) },
];

function loadEnvFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function getArgument(name: string): string | undefined {
  const argument = process.argv.find((value) => value.startsWith(`${name}=`));
  return argument?.slice(name.length + 1).trim() || undefined;
}

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI. Set it in the environment or in .env.local.');
  }
  await mongoose.connect(uri, { bufferCommands: false });
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  const userId = getArgument('--user');
  const farmName = getArgument('--farm');
  const apply = process.argv.includes('--apply');

  if (!userId || !farmName) {
    throw new Error('Usage: npx tsx scripts/clear-user-farm-data.ts --user=<clerkUserId> --farm=<farmName> [--apply]');
  }

  await connect();

  const user = await User.findOne({ clerkId: userId, farmName }).lean();
  if (!user) {
    throw new Error(`No User document matched clerkId "${userId}" and farmName "${farmName}". Nothing was deleted.`);
  }

  const filter = { userId };
  const counts = await Promise.all(
    tenantCollections.map(async (collection) => ({
      name: collection.name,
      count: await collection.count(filter),
    }))
  );

  console.log(`Matched farm "${user.farmName}" for user ${user.clerkId} (${user.email}).`);
  console.log('Records found:');
  for (const item of counts) console.log(`  ${item.name}: ${item.count}`);
  console.log('  User: 1');

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to permanently delete these records.');
    return;
  }

  const results = await Promise.all(
    tenantCollections.map(async (collection) => ({
      name: collection.name,
      deleted: (await collection.remove(filter)).deletedCount ?? 0,
    }))
  );
  const userResult = await User.deleteOne({ _id: user._id, clerkId: userId, farmName });

  console.log('Deleted records:');
  for (const result of results) console.log(`  ${result.name}: ${result.deleted}`);
  console.log(`  User: ${userResult.deletedCount}`);
}

main()
  .catch((error: unknown) => {
    console.error('Database cleanup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });