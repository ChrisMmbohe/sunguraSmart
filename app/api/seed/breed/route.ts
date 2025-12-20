// app/api/seed/breed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Breed } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v'; // Fixed user ID for seeding

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  // Check if already seeded
  const existing = await Breed.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Breeds already seeded' });
  }

  const breeds = [
    {
      name: 'New Zealand White',
      description: 'A popular meat breed known for fast growth and good mothering abilities.',
      average_mature_weight_kg: 4.5,
      maturity_age_days: 150,
      weaning_age_days: 30,
      grower_age_days: 60,
    },
    {
      name: 'Dutch',
      description: 'A small breed often used for pets, with distinctive markings.',
      average_mature_weight_kg: 2,
      maturity_age_days: 120,
      weaning_age_days: 28,
      grower_age_days: 56,
    },
    {
      name: 'Flemish Giant',
      description: 'One of the largest breeds, suitable for meat production.',
      average_mature_weight_kg: 6,
      maturity_age_days: 180,
      weaning_age_days: 35,
      grower_age_days: 70,
    },
    {
      name: 'Checkered',
      description: 'Known for their checkered pattern, good for show and meat.',
      average_mature_weight_kg: 5,
      maturity_age_days: 160,
      weaning_age_days: 32,
      grower_age_days: 64,
    },
  ];

  for (const breedData of breeds) {
    const breed = new Breed({ ...breedData, user_id: USER_ID });
    await breed.save();
  }

  return NextResponse.json({ message: 'Breeds seeded successfully' });
}