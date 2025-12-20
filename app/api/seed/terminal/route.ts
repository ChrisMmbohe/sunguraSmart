// app/api/seed/terminal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Cull, Death, Rabbit } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existingCulls = await Cull.countDocuments({ user_id: USER_ID });
  const existingDeaths = await Death.countDocuments({ user_id: USER_ID });
  if (existingCulls > 0 || existingDeaths > 0) {
    return NextResponse.json({ message: 'Terminal records already seeded' });
  }

  const rabbits = await Rabbit.find({ user_id: USER_ID, status: { $nin: ['Culled', 'Deceased', 'Sold'] } });

  // Terminate ~5% cull, 5% death
  const numTerminal = Math.floor(rabbits.length * 0.05);
  const cullRabbits = rabbits.sort(() => 0.5 - Math.random()).slice(0, numTerminal);
  const deathRabbits = rabbits.sort(() => 0.5 - Math.random()).slice(numTerminal, numTerminal * 2);

  for (const rabbit of cullRabbits) {
    const cullDate = new Date(rabbit.date_of_birth);
    cullDate.setDate(cullDate.getDate() + getRandomInt(180, 730));

    const cull = new Cull({
      user_id: USER_ID,
      rabbit_id: rabbit._id,
      date_culled: cullDate,
      reason: ['Meat', 'Health', 'Poor Performance', 'Other'][getRandomInt(0, 3)],
    });
    await cull.save();
    // Post-save middleware updates status to Culled
  }

  for (const rabbit of deathRabbits) {
    const deathDate = new Date(rabbit.date_of_birth);
    deathDate.setDate(deathDate.getDate() + getRandomInt(180, 730));

    const death = new Death({
      user_id: USER_ID,
      rabbit_id: rabbit._id,
      date_of_death: deathDate,
      cause_of_death: ['Disease', 'Injury', 'Old Age', 'Unknown'][getRandomInt(0, 3)],
    });
    await death.save();
    // Post-save middleware updates status to Deceased
  }

  return NextResponse.json({ message: 'Terminal records seeded successfully' });
}