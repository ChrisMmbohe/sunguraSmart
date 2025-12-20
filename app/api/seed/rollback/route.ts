// app/api/seed/rollback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import {
  Breed,
  Disease,
  FeedType,
  Cage,
  Rabbit,
  Breeding,
  Litter,
  Weight,
  HealthRecord,
  Cull,
  Death,
  FeedLog,
  Expense,
  Sale,
  Schedule,
} from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v'; // Same as seeding

// Define the order of deletion (reverse of seeding to respect refs and middleware)
const MODELS_TO_DELETE = [
  { model: Schedule, name: 'Schedules' },
  { model: Sale, name: 'Sales' },
  { model: Expense, name: 'Expenses' },
  { model: FeedLog, name: 'Feed Logs' },
  { model: Cull, name: 'Culls' },
  { model: Death, name: 'Deaths' },
  { model: HealthRecord, name: 'Health Records' },
  { model: Weight, name: 'Weights' },
  { model: Litter, name: 'Litters' },
  { model: Breeding, name: 'Breedings' },
  { model: Rabbit, name: 'Rabbits' },
  { model: Cage, name: 'Cages' },
  { model: FeedType, name: 'Feed Types' },
  { model: Disease, name: 'Diseases' },
  { model: Breed, name: 'Breeds' },
];

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  try {
    console.log('Starting rollback of seeded data...');

    for (const { model, name } of MODELS_TO_DELETE) {
      console.log(`Deleting ${name}...`);

      const count = await model.countDocuments({ user_id: USER_ID });
      if (count === 0) {
        console.log(`No ${name} found for rollback.`);
        continue;
      }

      const result = await model.deleteMany({ user_id: USER_ID });
      console.log(`Deleted ${result.deletedCount} ${name}.`);
    }

    console.log('Rollback completed successfully.');
    return NextResponse.json({ message: 'All seeded data rolled back successfully' });
  } catch (error) {
    console.error('Rollback failed:', error);
    return NextResponse.json(
      { error: 'Rollback failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}