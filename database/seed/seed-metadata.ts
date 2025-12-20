// src/database/seed-metadata.ts

import { setupDatabase, USER_ID, getRandomInt, getRandomElement } from './seed-utils';
import { Breed, Cage, FeedType, Disease, IBreed, ICage, IFeedType, IDisease } from '@/database/index';

// --- CORRECTED: Export the function for external API route use ---
export async function seedMetadata() {
  await setupDatabase();

  // --- 1. Breeds ---
  const breedData: Omit<IBreed, keyof (IBreed)[]>[] = [
    { name: 'New Zealand White', description: 'Commercial meat breed, fast growth.', average_mature_weight_kg: 5.0, maturity_age_days: 150, weaning_age_days: 30, grower_age_days: 60 },
    { name: 'Dutch', description: 'Small pet/show breed.', average_mature_weight_kg: 2.5, maturity_age_days: 180, weaning_age_days: 35, grower_age_days: 70 },
    { name: 'Flemish Giant', description: 'Largest breed, slow growth.', average_mature_weight_kg: 6.5, maturity_age_days: 210, weaning_age_days: 40, grower_age_days: 80 },
    { name: 'Checkered Giant', description: 'Large sport breed, distinctive markings.', average_mature_weight_kg: 5.5, maturity_age_days: 180, weaning_age_days: 30, grower_age_days: 65 },
  ];
  const breeds = breedData.map(b => ({ ...b, user_id: USER_ID }));
  await Breed.insertMany(breeds, { ordered: false }).catch(e => console.log('Breeds already exist.'));
  console.log('✅ Breeds seeded/verified.');

  // --- 2. Cages (3 Tiers, 4 cages per tier = 12 total cages for each area) ---
  const tiers = ['A', 'B', 'C', 'Q'] 

  let cageCount = 0;
  const cagePromises: Promise<any>[] = [];

  // Tier A, B, C (Buck, Doe, Grower Cages) - 12 cages each
  for (const tier of tiers.slice(0, 3)) {
    for (let i = 1; i <= 12; i++) {
      const cageName = `${tier}${i}`;
      let cageType: ICage['cage_type'];
      let capacity = 1;

      if (i <= 4) {
        cageType = 'Buck';
        capacity = 1;
      } else if (i <= 8) {
        cageType = 'Doe';
        capacity = 1;
      } else {
        cageType = 'Grower';
        capacity = getRandomInt(4, 8);
      }

      cagePromises.push(Cage.findOneAndUpdate(
        { user_id: USER_ID, name: cageName },
        { user_id: USER_ID, name: cageName, location_area: `Tier ${tier}`, capacity, cage_type: cageType },
        { upsert: true, new: true, runValidators: true }
      ));
      cageCount++;
    }
  }

  // Quarantine (Q-Tier) - 4 cages total
  for (let i = 1; i <= 4; i++) {
    const cageName = `Q${i}`;
    cagePromises.push(Cage.findOneAndUpdate(
      { user_id: USER_ID, name: cageName },
      { user_id: USER_ID, name: cageName, location_area: 'Quarantine Section', capacity: 1, cage_type: 'Quarantine' },
      { upsert: true, new: true, runValidators: true }
    ));
    cageCount++;
  }

  await Promise.all(cagePromises).catch(e => console.log('Cages already exist.'));
  console.log(`✅ ${cageCount} Cages seeded/verified.`);

  // --- 3. Feed Types ---
  const feedTypeData: Omit<IFeedType, keyof (IFeedType)[]>[] = [
    { name: 'Commercial Pellets', cost_per_kg: 0.85 },
    { name: 'Alfalfa Hay', cost_per_kg: 0.30 },
    { name: 'Oat Hay', cost_per_kg: 0.25 },
    { name: 'Vegetable Mix', cost_per_kg: 1.20 },
  ];
  const feedTypes = feedTypeData.map(f => ({ ...f, user_id: USER_ID }));
  await FeedType.insertMany(feedTypes, { ordered: false }).catch(e => console.log('Feed Types already exist.'));
  console.log('✅ Feed Types seeded/verified.');

  // --- 4. Diseases ---
  const diseaseData: Omit<IDisease, keyof (IDisease)[]>[] = [
    { name: 'Sore Hocks', symptoms: ['Ulceration on foot pads', 'Limping'], treatment_protocols: 'Topical antibiotic, soft bedding.', is_quarantinable: false },
    { name: 'Pasteurellosis (Snuffles)', symptoms: ['Sneeze', 'Nasal discharge', 'Head tilt'], treatment_protocols: 'Systemic antibiotics (e.g., Baytril).', is_quarantinable: true },
    { name: 'Coccidiosis', symptoms: ['Diarrhea', 'Weight loss', 'Bloating'], treatment_protocols: 'Coccidiostat in water (e.g., Sulfaquinoxaline).', is_quarantinable: true },
    { name: 'Ear Mites', symptoms: ['Scratching ears', 'Crusty deposits'], treatment_protocols: 'Ivermectin treatment.', is_quarantinable: false },
  ];
  const diseases = diseaseData.map(d => ({ ...d, user_id: USER_ID }));
  await Disease.insertMany(diseases, { ordered: false }).catch(e => console.log('Diseases already exist.'));
  console.log('✅ Diseases seeded/verified.');
}