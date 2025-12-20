// app/api/seed/simulate-breedings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Rabbit, Breeding, Litter, Cage, Breed } from '@/database/index';
import mongoose from 'mongoose';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';
const START_DATE = new Date('2024-01-01');
const CYCLES = 2; // Per generation (reduced from 6)
const DAYS_BETWEEN_CYCLES = 45; // Approximate breeding interval

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existingBreedings = await Breeding.countDocuments({ user_id: USER_ID });
  if (existingBreedings > 0) {
    return NextResponse.json({ message: 'Breedings already simulated' });
  }

  let does = await Rabbit.find({ user_id: USER_ID, gender: 'Female', status: 'Active' });
  let bucks = await Rabbit.find({ user_id: USER_ID, gender: 'Male', status: 'Active' });
  const growerCages = await Cage.find({ user_id: USER_ID, cage_type: 'Grower' });

  // Group bucks by breed
  let bucksByBreed: { [key: string]: any[] } = {};
  bucks.forEach(buck => {
    if (!bucksByBreed[buck.breed_id.toString()]) bucksByBreed[buck.breed_id.toString()] = [];
    bucksByBreed[buck.breed_id.toString()].push(buck);
  });

  // Simulate for 2 generations
  for (let gen = 0; gen < 2; gen++) {
    const breedsToCreate = [];
    const littersToCreate = [];
    const kitsToCreate = [];
    const cageUpdates: { cageId: any; kitIds: any[] }[] = [];

    for (let cycle = 0; cycle < CYCLES; cycle++) {
      const matingDate = new Date(START_DATE);
      matingDate.setDate(matingDate.getDate() + gen * 180 + cycle * DAYS_BETWEEN_CYCLES);

      for (const doe of does) {
        if (doe.is_pregnant) continue;

        const breedIdStr = doe.breed_id.toString();
        let availableBucks = bucksByBreed[breedIdStr] || [];
        availableBucks = availableBucks.filter(b => !doe.parent_buck_id || !b._id.equals(doe.parent_buck_id));

        if (availableBucks.length === 0) continue;

        const buck = availableBucks[getRandomInt(0, availableBucks.length - 1)];

        const breeding = {
          user_id: USER_ID,
          doe_id: doe._id,
          buck_id: buck._id,
          mating_date: matingDate,
          expected_kindling_date: new Date(matingDate.getTime() + 31 * 24 * 60 * 60 * 1000),
          is_successful: Math.random() < 0.8,
        };
        breedsToCreate.push(breeding);

        // Simulate success 80%
        if (breeding.is_successful) {
          const kindlingDate = breeding.expected_kindling_date;
          const kitsBorn = getRandomInt(6, 10);
          const kitsSurviving = getRandomInt(5, kitsBorn);

          const litter = {
            user_id: USER_ID,
            kindling_date: kindlingDate,
            doe_id: doe._id,
            buck_id: buck._id,
            total_kits_born: kitsBorn,
            kits_surviving: kitsSurviving,
          };
          littersToCreate.push({ litter, breedingIndex: breedsToCreate.length - 1 });

          // Create kits
          const cageKitIds = [];
          for (let k = 0; k < kitsSurviving; k++) {
            const gender = Math.random() < 0.5 ? 'Male' : 'Female';
            const earTag = `${doe.ear_tag_id}-K-${String(gen + 1)}-${String(cycle + 1)}-${String(k + 1).padStart(2, '0')}`;
            const kit = {
              user_id: USER_ID,
              ear_tag_id: earTag,
              gender,
              date_of_birth: kindlingDate,
              breed_id: doe.breed_id,
              current_cage_id: doe.current_cage_id,
              status: 'Kit',
              source_type: 'Born',
              parent_doe_id: doe._id,
              parent_buck_id: buck._id,
            };
            kitsToCreate.push(kit);
            cageKitIds.push(null); // Will be filled after save
          }
          if (cageKitIds.length > 0) {
            cageUpdates.push({ cageId: doe.current_cage_id, kitIds: cageKitIds });
          }
        }

        doe.is_pregnant = false;
      }
    }

    // Batch insert all records
    if (breedsToCreate.length > 0) {
      const breedings = await Breeding.insertMany(breedsToCreate);
      
      // Link litters to breedings
      for (const { litter, breedingIndex } of littersToCreate) {
        litter.breeding_id = breedings[breedingIndex]._id;
      }
      if (littersToCreate.length > 0) {
        const litters = await Litter.insertMany(littersToCreate.map(l => l.litter));
      }
    }

    if (kitsToCreate.length > 0) {
      await Rabbit.insertMany(kitsToCreate);
    }

    // Update cages with kits
    for (const { cageId, kitIds } of cageUpdates) {
      if (kitIds.length > 0) {
        await Cage.findByIdAndUpdate(cageId, { $push: { current_occupants: { $each: kitIds } } });
      }
    }

    // Update does and bucks for next generation
    const allRabbits = await Rabbit.find({ user_id: USER_ID, status: 'Active' });
    does = allRabbits.filter(r => r.gender === 'Female');
    bucks = allRabbits.filter(r => r.gender === 'Male');

    // Update bucksByBreed
    bucksByBreed = {};
    bucks.forEach(buck => {
      const breedStr = buck.breed_id.toString();
      if (!bucksByBreed[breedStr]) bucksByBreed[breedStr] = [];
      bucksByBreed[breedStr].push(buck);
    });
  }

  return NextResponse.json({ message: 'Breedings, litters, and kits simulated successfully' });
}