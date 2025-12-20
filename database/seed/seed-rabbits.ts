// src/database/seed-rabbits.ts

import { setupDatabase, fetchSeedIds, USER_ID, getRandomInt, daysAgo, getRandomElement, INITIAL_STOCK_COUNT } from './seed-utils';
import { Rabbit, Cage, IRabbit } from '@/database/index';
import { Types } from 'mongoose';

// --- CORRECTED: Export the function for external API route use ---
export async function seedRabbits() {
  await setupDatabase();
  // Fetch existing breed and cage IDs, which are required dependencies
  const { breeds, cages } = await fetchSeedIds();
  
  // Guard clause: Ensure we have breeds to link the rabbits to
  if (breeds.length === 0) {
    console.error('CRITICAL: No breeds found in the database. Cannot seed rabbits.');
    return;
  }

  // Clear existing rabbits and cage occupants to ensure a clean start for the initial stock
  await Rabbit.deleteMany({ user_id: USER_ID });
  await Cage.updateMany({ user_id: USER_ID }, { $set: { current_occupants: [] } });
  console.log('Cleared existing Rabbits and Cage occupants.');

  // The type for initialStock is simplified to better align with the IRabbit interface
  const initialStock: (Omit<IRabbit, 'user_id'> & { user_id?: string })[] = [];
  
  // --- 1. Select Cages ---
  // Assuming cage types are defined and exist from the metadata seeding step
  const buckCages = cages.filter(c => c.cage_type === 'Buck');
  const doeCages = cages.filter(c => c.cage_type === 'Doe');
  // Grower cages are not used for initial breeding stock but are still filtered
  // const growerCages = cages.filter(c => c.cage_type === 'Grower'); 

  let currentBuckIndex = 0;
  let currentDoeIndex = 0;

  // --- 2. Create Breeding Stock (1 Buck : 10 Does ratio) ---
  // Ensure total does is calculated from the available doe cages, not just a fixed number, 
  // but using INITIAL_STOCK_COUNT for consistency with the original intent.
  const totalDoes = Math.floor(INITIAL_STOCK_COUNT * 0.9);
  const totalBucks = Math.ceil(INITIAL_STOCK_COUNT * 0.1);

  // Create Bucks
  for (let i = 0; i < totalBucks; i++) {
    const breed = getRandomElement(breeds);
    // Use modular arithmetic to cycle through available cages
    const cage = buckCages[currentBuckIndex++ % buckCages.length];
    
    const dob = daysAgo(getRandomInt(180, 365)); // 6 to 12 months old

    initialStock.push({
      ear_tag_id: `B-${i + 1}`,
      name: `Buck ${i + 1}`,
      gender: 'Male',
      date_of_birth: dob,
      // FIX: Explicitly convert ID to Mongoose ObjectId
      breed_id: new Types.ObjectId(breed._id), 
      current_cage_id: cage._id,
      status: 'Active',
      source_type: 'Purchased',
      source_farm: 'Local Breeder A',
      parent_doe_id: null,
      parent_buck_id: null,
    });
  }

  // Create Does
  for (let i = 0; i < totalDoes; i++) {
    const breed = getRandomElement(breeds);
    // Use modular arithmetic to cycle through available cages
    const cage = doeCages[currentDoeIndex++ % doeCages.length];
    
    const dob = daysAgo(getRandomInt(180, 365)); // 6 to 12 months old
    
    initialStock.push({
      ear_tag_id: `D-${i + 1}`,
      name: `Doe ${i + 1}`,
      gender: 'Female',
      date_of_birth: dob,
      // FIX: Explicitly convert ID to Mongoose ObjectId
      breed_id: new Types.ObjectId(breed._id),
      current_cage_id: cage._id,
      status: 'Active',
      source_type: 'Purchased',
      source_farm: 'Local Breeder B',
      parent_doe_id: null,
      parent_buck_id: null,
    });
  }

  // --- 3. Save Rabbits and Update Cages ---
  // Map the initial stock to include the mandatory user_id before insertion
  const rabbits = initialStock.map(r => ({ ...r, user_id: USER_ID }));
  // Mongoose's insertMany should successfully handle the populated `breed_id`
  const createdRabbits = await Rabbit.insertMany(rabbits);
  console.log(`✅ ${createdRabbits.length} Initial Rabbits seeded.`);

  // Update Cage Occupants: Group rabbits by their assigned cage ID
  const cageUpdates = createdRabbits.reduce((acc, rabbit) => {
    // Note: The cage ID is already an ObjectId from the original fetch
    const cageId = rabbit.current_cage_id.toString(); 
    if (!acc[cageId]) {
      acc[cageId] = [];
    }
    acc[cageId].push(rabbit._id);
    return acc;
  }, {} as Record<string, Types.ObjectId[]>);

  // Execute all cage updates concurrently
  const updatePromises = Object.entries(cageUpdates).map(([cageId, rabbitIds]) => 
    // $each is required for pushing multiple elements into an array field
    Cage.findByIdAndUpdate(cageId, { $push: { current_occupants: { $each: rabbitIds } } })
  );
  
  await Promise.all(updatePromises);
  console.log('✅ Cage occupants updated.');
}