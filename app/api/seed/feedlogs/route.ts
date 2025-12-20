// app/api/seed/feedlogs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { FeedLog, Cage, FeedType } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';
const START_DATE = new Date('2024-01-01');
const END_DATE = new Date('2025-12-20');

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existing = await FeedLog.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Feed logs already seeded' });
  }

  const cages = await Cage.find({ user_id: USER_ID });
  const feedTypes = await FeedType.find({ user_id: USER_ID });

  const feedLogs = [];
  const currentDate = new Date(START_DATE);
  
  while (currentDate <= END_DATE) {
    for (const cage of cages) {
      // Approximate quantity based on type/capacity, add randomness
      const baseQty = cage.capacity * 0.2; // 0.2kg per rabbit per day avg
      const quantity = getRandomFloat(baseQty * 0.8, baseQty * 1.2);
      if (quantity <= 0) continue;

      const feedType = feedTypes[getRandomInt(0, feedTypes.length - 1)];
      const cost = quantity * feedType.cost_per_kg;

      feedLogs.push({
        user_id: USER_ID,
        feed_type_id: feedType._id,
        log_date: new Date(currentDate),
        quantity_kg: quantity,
        cost_usd: cost,
        cage_id: cage._id,
      });
    }
    currentDate.setDate(currentDate.getDate() + 1); // Daily
  }

  // Batch insert all feed logs
  if (feedLogs.length > 0) {
    await FeedLog.insertMany(feedLogs);
  }

  return NextResponse.json({ message: 'Feed logs seeded successfully' });
}