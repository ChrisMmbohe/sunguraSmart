// app/api/seed/weights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Weight, Rabbit, Breed } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';

function getRandomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existing = await Weight.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Weights already seeded' });
  }

  const rabbits = await Rabbit.find({ user_id: USER_ID });
  const breeds = await Breed.find({ user_id: USER_ID });
  const breedMatureWeight: { [key: string]: number } = {};
  breeds.forEach(b => { breedMatureWeight[b._id.toString()] = b.average_mature_weight_kg; });

  const allWeights = [];

  for (const rabbit of rabbits) {
    const matureWeight = breedMatureWeight[rabbit.breed_id.toString()];
    const maturityDays = 150; // Average
    let currentDate = new Date(rabbit.date_of_birth);
    const endDate = new Date(); // Up to now
    let day = 0;

    while (currentDate < endDate) {
      const ageDays = day;
      let weight = 0.05; // Birth weight
      if (ageDays > 0) {
        const growthFactor = Math.min(ageDays / maturityDays, 1);
        weight = getRandomFloat(matureWeight * growthFactor * 0.9, matureWeight * growthFactor * 1.1);
      }

      allWeights.push({
        user_id: USER_ID,
        rabbit_id: rabbit._id,
        measurement_date: currentDate,
        weight_kg: weight,
        age_at_measurement_days: ageDays,
      });

      day += 30; // Monthly instead of weekly
      currentDate = new Date(rabbit.date_of_birth);
      currentDate.setDate(currentDate.getDate() + day);
    }
  }

  // Batch insert all weights
  if (allWeights.length > 0) {
    await Weight.insertMany(allWeights);
  }

  return NextResponse.json({ message: 'Weights seeded successfully' });
}