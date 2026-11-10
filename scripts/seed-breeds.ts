/**
 * Insert the commercial rabbit breeds commonly used by farms in East Africa.
 * Existing breeds with the same name for the farm are left unchanged.
 *
 * Usage:
 *   npx tsx scripts/seed-breeds.ts --user=<clerkUserId> --farm=<farmName>
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

import { Breed } from '../database/models/Breed_model';
import { User } from '../database/models/User.model';

interface BreedSeed {
  name: string;
  description: string;
  averageAdultWeightKg: number;
  averageLitterSize: number;
  gestationDays: number;
  maturityAgeDays: number;
  weaningAgeDays: number;
}

const commercialBreeds: BreedSeed[] = [
  {
    name: 'New Zealand White',
    description: 'Widely used commercial meat breed and a common foundation for crossbreeding.',
    averageAdultWeightKg: 4.5,
    averageLitterSize: 8,
    gestationDays: 31,
    maturityAgeDays: 150,
    weaningAgeDays: 42,
  },
  {
    name: 'Californian',
    description: 'Commercial meat breed valued for efficient growth and good carcass quality.',
    averageAdultWeightKg: 4.2,
    averageLitterSize: 8,
    gestationDays: 31,
    maturityAgeDays: 150,
    weaningAgeDays: 42,
  },
  {
    name: 'Chinchilla',
    description: 'Dual-purpose breed kept for meat and fur, including by small commercial farms.',
    averageAdultWeightKg: 4.1,
    averageLitterSize: 7,
    gestationDays: 31,
    maturityAgeDays: 150,
    weaningAgeDays: 42,
  },
  {
    name: 'Flemish Giant',
    description: 'Large meat breed used in commercial production and crossbreeding programs.',
    averageAdultWeightKg: 6.5,
    averageLitterSize: 7,
    gestationDays: 31,
    maturityAgeDays: 180,
    weaningAgeDays: 49,
  },
  {
    name: 'Rex',
    description: 'Commercial dual-purpose breed kept for meat and valuable rex fur.',
    averageAdultWeightKg: 4.0,
    averageLitterSize: 6,
    gestationDays: 31,
    maturityAgeDays: 150,
    weaningAgeDays: 42,
  },
  {
    name: 'Checkered Giant',
    description: 'Large meat breed used by commercial and smallholder farms, including in crossbreeding.',
    averageAdultWeightKg: 5.5,
    averageLitterSize: 7,
    gestationDays: 31,
    maturityAgeDays: 180,
    weaningAgeDays: 49,
  },
  {
    name: 'Dutch',
    description: 'Hardy dual-purpose breed suitable for small commercial meat and breeding operations.',
    averageAdultWeightKg: 2.5,
    averageLitterSize: 6,
    gestationDays: 31,
    maturityAgeDays: 150,
    weaningAgeDays: 42,
  },
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

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  const userId = getArgument('--user');
  const farmName = getArgument('--farm');
  const uri = process.env.MONGODB_URI;

  if (!userId || !farmName) {
    throw new Error('Usage: npx tsx scripts/seed-breeds.ts --user=<clerkUserId> --farm=<farmName>');
  }
  if (!uri) {
    throw new Error('Missing MONGODB_URI. Set it in the environment or in .env.local.');
  }

  await mongoose.connect(uri, { bufferCommands: false });

  const farm = await User.findOne({ clerkId: userId, farmName }).select('farmName').lean();
  if (!farm) {
    throw new Error(`No farm named "${farmName}" belongs to user "${userId}".`);
  }

  const result = await Breed.bulkWrite(
    commercialBreeds.map((breed) => ({
      updateOne: {
        filter: { userId, name: breed.name },
        update: { $setOnInsert: { userId, ...breed } },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  console.log(`Breed seed complete for farm "${farmName}" (${userId}).`);
  console.log(`Inserted: ${result.upsertedCount}`);
  console.log(`Already present: ${commercialBreeds.length - result.upsertedCount}`);
}

main()
  .catch((error: unknown) => {
    console.error('Breed seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });