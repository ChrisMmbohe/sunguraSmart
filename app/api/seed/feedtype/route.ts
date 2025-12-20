// app/api/seed/feedtype/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { FeedType } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existing = await FeedType.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Feed types already seeded' });
  }

  const feedTypes = [
    { name: 'Hay', cost_per_kg: 0.5 },
    { name: 'Pellets', cost_per_kg: 1.0 },
    { name: 'Vegetables', cost_per_kg: 0.3 },
  ];

  for (const feedData of feedTypes) {
    const feedType = new FeedType({ ...feedData, user_id: USER_ID });
    await feedType.save();
  }

  return NextResponse.json({ message: 'Feed types seeded successfully' });
}