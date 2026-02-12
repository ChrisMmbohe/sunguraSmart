// app/api/seed/simulate-breedings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Rabbit, Breeding, Litter, Cage } from '@/database/index';
import mongoose from 'mongoose';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';
const START_DATE = new Date('2024-01-01');
const CYCLES = 2; // Per generation
const DAYS_BETWEEN_CYCLES = 45;

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const existingBreedings = await Breeding.countDocuments({ user_id: USER_ID });
    if (existingBreedings > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Breedings already simulated',
        summary: { breedings: 0, litters: 0, kits: 0 }
      });
    }

    const does = await Rabbit.find({ user_id: USER_ID, gender: 'Female', status: 'Active' });
    const bucks = await Rabbit.find({ user_id: USER_ID, gender: 'Male', status: 'Active' });
    const allCages = await Cage.find({ user_id: USER_ID });

    if (does.length === 0 || bucks.length === 0) {
      return NextResponse.json({ error: 'No active breeders found. Please seed rabbits first.' }, { status: 400 });
    }

    const breedsToCreate = [];
    const littersToCreate = [];
    const kitsToCreate = [];
    const cageUpdates = new Map(); // Use Map to aggregate updates per cage

    for (let cycle = 0; cycle < CYCLES; cycle++) {
      const matingDate = new Date(START_DATE);
      matingDate.setDate(matingDate.getDate() + (cycle * DAYS_BETWEEN_CYCLES));

      for (const doe of does) {
        const buck = bucks[getRandomInt(0, bucks.length - 1)];
        const isSuccessful = Math.random() > 0.15; // 85% success rate
        
        const breedingId = new mongoose.Types.ObjectId();
        const kindlingDate = new Date(matingDate);
        kindlingDate.setDate(kindlingDate.getDate() + 31);

        const breedingDoc = {
          _id: breedingId,
          user_id: USER_ID,
          doe_id: doe._id,
          buck_id: buck._id,
          mating_date: matingDate,
          expected_kindling_date: kindlingDate,
          is_successful: isSuccessful,
          litter_id: null as mongoose.Types.ObjectId | null
        };

        if (isSuccessful) {
          const litterId = new mongoose.Types.ObjectId();
          const totalBorn = getRandomInt(4, 10);
          const surviving = Math.max(0, totalBorn - getRandomInt(0, 2));

          littersToCreate.push({
            _id: litterId,
            user_id: USER_ID,
            breeding_id: breedingId,
            doe_id: doe._id,
            buck_id: buck._id,
            kindling_date: kindlingDate,
            total_kits_born: totalBorn,
            kits_surviving: surviving,
            current_kits_count: surviving,
            status: 'Active'
          });

          breedingDoc.litter_id = litterId;

          // Find a suitable cage
          const cage = allCages.find(c => c.cage_type === 'Grower' && c.current_occupants.length < 10) || allCages[0];
          
          if (cage) {
            const cageKitIds = [];
            for (let i = 0; i < surviving; i++) {
              const kitId = new mongoose.Types.ObjectId();
              cageKitIds.push(kitId);
              
              const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
              const earTag = `K${cycle}-${doe.ear_tag_id.split('-').pop()}-${i}-${randomSuffix}`;
              
              kitsToCreate.push({
                _id: kitId,
                user_id: USER_ID,
                ear_tag_id: earTag,
                gender: Math.random() > 0.5 ? 'Male' : 'Female',
                date_of_birth: kindlingDate,
                breed_id: doe.breed_id,
                current_cage_id: cage._id,
                status: 'Kit',
                source_type: 'Born',
                parent_doe_id: doe._id,
                parent_buck_id: buck._id
              });
            }

            if (cageKitIds.length > 0) {
              const existing = cageUpdates.get(cage._id.toString()) || [];
              cageUpdates.set(cage._id.toString(), [...existing, ...cageKitIds]);
            }
          }
        }
        
        breedsToCreate.push(breedingDoc);
      }
    }

    // Execute database operations
    if (breedsToCreate.length > 0) await Breeding.insertMany(breedsToCreate);
    if (littersToCreate.length > 0) await Litter.insertMany(littersToCreate);
    if (kitsToCreate.length > 0) await Rabbit.insertMany(kitsToCreate);

    // Update Cages
    for (const [cageId, kitIds] of cageUpdates.entries()) {
      await Cage.findByIdAndUpdate(cageId, {
        $push: { current_occupants: { $each: kitIds } }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Simulation completed successfully',
      summary: {
        breedings: breedsToCreate.length,
        litters: littersToCreate.length,
        kits: kitsToCreate.length
      }
    });
  } catch (error: any) {
    console.error('Seeding process failed:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Seeding failed', 
      details: error.message 
    }, { status: 500 });
  }
}