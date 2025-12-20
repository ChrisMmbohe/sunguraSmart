// app/api/seed/schedules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Schedule, Breeding, Litter, Rabbit } from '@/database/index';

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

  const existing = await Schedule.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Schedules already seeded' });
  }

  const breedings = await Breeding.find({ user_id: USER_ID });
  const rabbits = await Rabbit.find({ user_id: USER_ID });

  for (const breeding of breedings) {
    // Breeding schedule
    const breedingSched = new Schedule({
      user_id: USER_ID,
      target_date: breeding.mating_date,
      type: 'Breeding',
      description: `Breed doe ${breeding.doe_id} with buck ${breeding.buck_id}`,
      is_completed: true, // Past
      related_rabbit_ids: [breeding.doe_id, breeding.buck_id],
      related_entity_id: breeding._id,
    });
    await breedingSched.save();

    // Palpation ~14 days after mating
    const palpationDate = new Date(breeding.mating_date);
    palpationDate.setDate(palpationDate.getDate() + 14);
    const palpationSched = new Schedule({
      user_id: USER_ID,
      target_date: palpationDate,
      type: 'Palpation',
      description: `Palpate doe ${breeding.doe_id}`,
      is_completed: true,
      related_rabbit_ids: [breeding.doe_id],
      related_entity_id: breeding._id,
    });
    await palpationSched.save();

    if (breeding.litter_id) {
      // Kindling
      const kindlingSched = new Schedule({
        user_id: USER_ID,
        target_date: breeding.expected_kindling_date,
        type: 'Kindling',
        description: `Expected kindling for doe ${breeding.doe_id}`,
        is_completed: true,
        related_rabbit_ids: [breeding.doe_id],
        related_entity_id: breeding.litter_id,
      });
      await kindlingSched.save();

      // Weaning ~30 days after kindling
      const weaningDate = new Date(breeding.expected_kindling_date);
      weaningDate.setDate(weaningDate.getDate() + 30);
      const weaningSched = new Schedule({
        user_id: USER_ID,
        target_date: weaningDate,
        type: 'Weaning',
        description: `Wean litter from doe ${breeding.doe_id}`,
        is_completed: true,
        related_rabbit_ids: [breeding.doe_id],
        related_entity_id: breeding.litter_id,
      });
      await weaningSched.save();
    }
  }

  // Random vaccination/admin for rabbits
  for (const rabbit of rabbits.slice(0, 50)) { // Some
    const vaccDate = new Date(rabbit.date_of_birth);
    vaccDate.setDate(vaccDate.getDate() + getRandomInt(60, 365));
    const vaccSched = new Schedule({
      user_id: USER_ID,
      target_date: vaccDate,
      type: 'Vaccination',
      description: `Vaccinate rabbit ${rabbit.ear_tag_id}`,
      is_completed: Math.random() < 0.8,
      related_rabbit_ids: [rabbit._id],
    });
    await vaccSched.save();
  }

  return NextResponse.json({ message: 'Schedules seeded successfully' });
}