// app/api/seed/cage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Cage } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existing = await Cage.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Cages already seeded' });
  }

  const tiers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // 10 tiers for 120 cages
  const cages = [];

  for (const tier of tiers) {
    for (let i = 1; i <= 12; i++) {
      cages.push({
        name: `${tier}${i}`,
        location_area: `Tier ${tier}`,
        capacity: 1, // Default, adjust below
        current_occupants: [],
        cage_type: 'Doe', // Default, adjust distribution
      });
    }
  }

  // Distribute types
  let buckCount = 0, doeCount = 0, growerCount = 0, quarantineCount = 0, nestingCount = 0;
  for (const cage of cages) {
    if (buckCount < 10) {
      cage.cage_type = 'Buck';
      cage.capacity = 1;
      buckCount++;
    } else if (doeCount < 91) {
      cage.cage_type = 'Doe';
      cage.capacity = 1;
      doeCount++;
    } else if (growerCount < 9) {
      cage.cage_type = 'Grower';
      cage.capacity = 10;
      growerCount++;
    } else if (quarantineCount < 5) {
      cage.cage_type = 'Quarantine';
      cage.capacity = 1;
      quarantineCount++;
    } else if (nestingCount < 5) {
      cage.cage_type = 'Nesting';
      cage.capacity = 1;
      nestingCount++;
    }
  }

  for (const cageData of cages) {
    const cage = new Cage({ ...cageData, user_id: USER_ID });
    await cage.save();
  }

  return NextResponse.json({ message: 'Cages seeded successfully' });
}