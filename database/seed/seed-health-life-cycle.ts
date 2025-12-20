// src/database/seed-health-life-cycle.ts

import { setupDatabase, fetchSeedIds, USER_ID, getRandomInt, daysAgo, getRandomElement } from './seed-utils';
import { Rabbit, HealthRecord, Cull, Death, IHealthRecord, ICull, IDeath } from '@/database/index';
import { Types } from 'mongoose';

// --- CORRECTED: Export the function for external API route use ---
export async function seedHealthLifeCycle() {
  await setupDatabase();
  const { diseases, does, bucks } = await fetchSeedIds();
  
  const allActiveRabbits = [...bucks, ...does];

  // --- 1. Health Records (Sick/Quarantined) ---
  await HealthRecord.deleteMany({ user_id: USER_ID });
  const healthRecords: Omit<IHealthRecord, keyof (IHealthRecord)[]>[] = [];
  const sickRabbits = new Set<string>();

  const numberSick = getRandomInt(5, 10); 
  const sickCandidates = allActiveRabbits.slice(0, numberSick);

  for (const rabbit of sickCandidates) {
    const disease = getRandomElement(diseases);
    const diagnosisDate = daysAgo(getRandomInt(5, 60));
    const treatmentStartDate = diagnosisDate;
    
    let treatmentEndDate = null;
    let isQuarantined = disease.is_quarantinable;
    
    if (Math.random() > 0.5) {
        treatmentEndDate = daysAgo(getRandomInt(1, 4));
    } else {
        sickRabbits.add(rabbit._id.toString());
    }

    healthRecords.push({
        rabbit_id: rabbit._id as Types.ObjectId,
        disease_id: disease._id as Types.ObjectId,
        date_of_diagnosis: diagnosisDate,
        treatment_start_date: treatmentStartDate,
        treatment_end_date: treatmentEndDate,
        quarantined: isQuarantined,
        notes: `Initial treatment for ${disease.name}.`,
    });
  }

  await HealthRecord.insertMany(healthRecords.map(h => ({ ...h, user_id: USER_ID })));
  console.log(`✅ ${healthRecords.length} Health Records seeded.`);
  console.log(`Rabbits currently marked as sick/quarantined: ${sickRabbits.size}`);

  // --- 2. Terminal Records (Cull and Death) ---
  await Cull.deleteMany({ user_id: USER_ID });
  await Death.deleteMany({ user_id: USER_ID });

  const culledRabbit = allActiveRabbits[numberSick]; 
  const deathRabbit = allActiveRabbits[numberSick + 1];

  // Cull Record
  const cull: Omit<ICull, keyof (ICull)[]> = {
    rabbit_id: culledRabbit._id as Types.ObjectId,
    date_culled: daysAgo(getRandomInt(100, 200)),
    reason: 'Meat', 
  };
  await Cull.create({ ...cull, user_id: USER_ID });
  
  // Death Record
  const death: Omit<IDeath, keyof (IDeath)[]> = {
    rabbit_id: deathRabbit._id as Types.ObjectId,
    date_of_death: daysAgo(getRandomInt(50, 150)),
    cause_of_death: 'Unexpected respiratory failure',
  };
  await Death.create({ ...death, user_id: USER_ID });

  console.log('✅ Cull and Death records seeded.');
}