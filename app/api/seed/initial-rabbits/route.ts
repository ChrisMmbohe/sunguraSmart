// app/api/seed/initial-rabbits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Rabbit, Breed, Cage } from '@/database/index';
import mongoose from 'mongoose';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existing = await Rabbit.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Initial rabbits already seeded' });
  }

  const breeds = await Breed.find({ user_id: USER_ID });
  const breedMap: { [key: string]: mongoose.Types.ObjectId } = {};
  breeds.forEach(b => { breedMap[b.name] = b._id; });

  const buckCages = await Cage.find({ user_id: USER_ID, cage_type: 'Buck' });
  const doeCages = await Cage.find({ user_id: USER_ID, cage_type: 'Doe' });

  if (buckCages.length < 10 || doeCages.length < 91) {
    return NextResponse.json({ 
      error: 'Insufficient cages', 
      details: `Need 10 bucks and 91 does, got ${buckCages.length} bucks and ${doeCages.length} does`
    }, { status: 400 });
  }

  const breedNames = ['New Zealand White', 'Dutch', 'Flemish Giant', 'Checkered'];
  const bucksPerBreed = [3, 2, 2, 2]; // ~9 bucks
  const doesPerBreed = [23, 23, 23, 22]; // 91 does

  const initialDob = new Date('2023-01-01'); // Mature at start of 2024

  let buckIndex = 0, doeIndex = 0;
  const rabbits = [];

  for (let b = 0; b < breedNames.length; b++) {
    const breedName = breedNames[b];
    const breedId = breedMap[breedName];

    if (!breedId) {
      return NextResponse.json({ 
        error: `Breed not found: ${breedName}` 
      }, { status: 400 });
    }

    // Bucks
    for (let i = 0; i < bucksPerBreed[b]; i++) {
      if (buckIndex >= buckCages.length) {
        return NextResponse.json({ 
          error: `Insufficient buck cages for breed ${breedName}` 
        }, { status: 400 });
      }
      const earTag = `${breedName.slice(0,3).toUpperCase()}-B-${String(i+1).padStart(3, '0')}`;
      const cage = buckCages[buckIndex++];
      const rabbit = new Rabbit({
        user_id: USER_ID,
        ear_tag_id: earTag,
        gender: 'Male',
        date_of_birth: initialDob,
        breed_id: breedId,
        current_cage_id: cage._id,
        status: 'Active',
        source_type: 'Purchased',
        source_farm: 'Kenya Rabbit Farm',
      });
      await rabbit.save();
      await Cage.findByIdAndUpdate(cage._id, { $push: { current_occupants: rabbit._id } });
    }

    // Does
    for (let i = 0; i < doesPerBreed[b]; i++) {
      if (doeIndex >= doeCages.length) {
        return NextResponse.json({ 
          error: `Insufficient doe cages for breed ${breedName}` 
        }, { status: 400 });
      }
      const earTag = `${breedName.slice(0,3).toUpperCase()}-D-${String(i+1).padStart(3, '0')}`;
      const cage = doeCages[doeIndex++];
      const rabbit = new Rabbit({
        user_id: USER_ID,
        ear_tag_id: earTag,
        gender: 'Female',
        date_of_birth: initialDob,
        breed_id: breedId,
        current_cage_id: cage._id,
        status: 'Active',
        source_type: 'Purchased',
        source_farm: 'Kenya Rabbit Farm',
      });
      await rabbit.save();
      await Cage.findByIdAndUpdate(cage._id, { $push: { current_occupants: rabbit._id } });
    }
  }

  return NextResponse.json({ message: 'Initial rabbits seeded successfully' });
}