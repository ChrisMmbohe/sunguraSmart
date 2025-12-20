// src/database/seed-breeding.ts

import { setupDatabase, fetchSeedIds, USER_ID, getRandomInt, daysAgo, daysFrom, getRandomElement, getRandomDate } from './seed-utils';
import { Rabbit, Breeding, Litter, Weight, IBreeding, ILitter, ILitterWeightLog, IWeight } from '@/database/index';
import { Types } from 'mongoose';

const BREEDING_CYCLES = 3; 

// --- CORRECTED: Export the function for external API route use ---
export async function seedBreeding() {
  await setupDatabase();
  const { does, bucks } = await fetchSeedIds();
  
  await Breeding.deleteMany({ user_id: USER_ID });
  await Litter.deleteMany({ user_id: USER_ID });
  
  const coreDoes = does.slice(0, 5);
  const coreBucks = bucks.slice(0, 2);

  const newRabbits: Types.ObjectId[] = [];
  let earTagCounter = 101; 

  for (let cycle = 1; cycle <= BREEDING_CYCLES; cycle++) {
    console.log(`--- Starting Breeding Cycle ${cycle} ---`);
    const breedingRecords: Omit<IBreeding, keyof (IBreeding)[]>[] = [];
    
    const cycleMatingDate = daysAgo(365 - (cycle * 100));

    for (const doe of coreDoes) {
      const buck = getRandomElement(coreBucks.filter(b => b._id.toString() !== doe.parent_buck_id?.toString()));
      
      const matingDate = daysFrom(cycleMatingDate, getRandomInt(0, 7));
      const expectedKindlingDate = daysFrom(matingDate, 31);
      
      const breeding: Omit<IBreeding, keyof (IBreeding)[]> = {
        doe_id: doe._id as Types.ObjectId,
        buck_id: buck._id as Types.ObjectId,
        mating_date: matingDate,
        expected_kindling_date: expectedKindlingDate,
        is_successful: true, 
        litter_id: null,
      };
      breedingRecords.push(breeding);
    }
    
    const createdBreedingRecords = await Breeding.insertMany(breedingRecords.map(b => ({ ...b, user_id: USER_ID })));

    const litterRecords: Omit<ILitter, keyof (ILitter)[]>[] = [];
    const litterRabbitCreations: IRabbit[] = [];
    
    for (const breedingDoc of createdBreedingRecords) {
      const kindlingDate = daysFrom(breedingDoc.mating_date, getRandomInt(30, 33));
      const totalKitsBorn = getRandomInt(6, 12);
      const kitsSurviving = totalKitsBorn - getRandomInt(0, 2); 
      const weaningDate = daysFrom(kindlingDate, 40); 

      const litter: Omit<ILitter, keyof (ILitter)[]> = {
        breeding_id: breedingDoc._id as Types.ObjectId,
        kindling_date: kindlingDate,
        doe_id: breedingDoc.doe_id as Types.ObjectId,
        buck_id: breedingDoc.buck_id as Types.ObjectId,
        total_kits_born: totalKitsBorn,
        kits_surviving: kitsSurviving,
        weaning_date: weaningDate,
        litter_weight_logs: [] as Types.DocumentArray<ILitterWeightLog>,
      };

      // 1. Simulate Litter Weight Logs
      for (let wDay = 7; wDay <= 40; wDay += getRandomInt(7, 10)) {
        const weightDate = daysFrom(kindlingDate, wDay);
        const totalLitterWeightKg = kitsSurviving * (wDay / 40) * 0.1; 
        litter.litter_weight_logs.push({
            measurement_date: weightDate, 
            total_litter_weight_kg: parseFloat(totalLitterWeightKg.toFixed(2)) 
        } as ILitterWeightLog);
      }
      litterRecords.push(litter);
      
      // 2. Create Rabbit records for the surviving kits 
      const doeInfo = coreDoes.find(d => d._id.equals(breedingDoc.doe_id));
      if (!doeInfo) continue;
      
      const breedId = doeInfo.breed_id;
      const growerCage = getRandomElement(
        (await fetchSeedIds()).cages.filter(c => c.cage_type === 'Grower')
      );

      for (let i = 0; i < kitsSurviving; i++) {
        const gender = Math.random() < 0.5 ? 'Male' : 'Female';
        const earTag = `P${cycle}-${earTagCounter++}`;
        
        litterRabbitCreations.push({
          ear_tag_id: earTag,
          name: null,
          gender: gender,
          date_of_birth: kindlingDate,
          // FIX: Explicitly convert ID to Mongoose ObjectId
          breed_id: new Types.ObjectId(breedId),
          current_cage_id: growerCage._id as Types.ObjectId,
          status: 'Weaner', 
          source_type: 'Born',
          source_farm: null,
          parent_doe_id: doeInfo._id as Types.ObjectId,
          parent_buck_id: breedingDoc.buck_id as Types.ObjectId,
        } as IRabbit);
      }
    }
    
    // Save Litter Records
    const createdLitters = await Litter.insertMany(litterRecords.map(l => ({ ...l, user_id: USER_ID })));
    console.log(`✅ ${createdLitters.length} Litters created in Cycle ${cycle}.`);
    
    // Update Breeding records with litter_id
    const updateBreedingPromises = createdBreedingRecords.map((b, index) => 
        Breeding.findByIdAndUpdate(b._id, { litter_id: createdLitters[index]._id, is_successful: true })
    );
    await Promise.all(updateBreedingPromises);
    
    // Save New Rabbits (Kits)
    const newRabbitsDocs = await Rabbit.insertMany(litterRabbitCreations.map(r => ({ ...r, user_id: USER_ID })));
    newRabbitsDocs.forEach(r => newRabbits.push(r._id));
    console.log(`✅ ${newRabbitsDocs.length} New Rabbits (Kits) created in Cycle ${cycle}.`);

    // Update Cage occupants for new kits
    const cageUpdates = newRabbitsDocs.reduce((acc, rabbit) => {
        const cageId = rabbit.current_cage_id.toString();
        if (!acc[cageId]) {
          acc[cageId] = [];
        }
        acc[cageId].push(rabbit._id);
        return acc;
    }, {} as Record<string, Types.ObjectId[]>);

    const updateCagePromises = Object.entries(cageUpdates).map(([cageId, rabbitIds]) => 
        Rabbit.model<Rabbit>('Cage').findByIdAndUpdate(cageId, { $push: { current_occupants: { $each: rabbitIds } } })
    );
    await Promise.all(updateCagePromises);
  }
}