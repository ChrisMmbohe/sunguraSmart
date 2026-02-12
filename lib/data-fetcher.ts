// lib/data-fetcher.ts

import connectDB from '@/lib/mongodb';
import { Rabbit as RabbitModel } from '@/database/rabbit.model'; // ✅ Fix: Use named import 'Rabbit' and rename it to 'RabbitModel'
import { Breed as BreedModel } from '@/database/breed.model';
import { Cage as CageModel } from '@/database/cage.model';
import { Breeding as BreedingModel } from '@/database/breeding.model';
import { Litter as LitterModel } from '@/database/litter.model';
import { HealthRecord as HealthRecordModel } from '@/database/health-record.model';
import { Disease as DiseaseModel } from '@/database/disease.model';
import { Schedule as ScheduleModel } from '@/database/schedule.model';
import { RabbitTableData } from '@/app/rabbits/types';
import { BreedingTableData } from '@/app/breeding/types';
import { LitterTableData } from '@/app/litters/types';
import { HealthRecordTableData } from '@/app/health/types';
import { IBreed, ICage, IHealthRecord, IDisease, IRabbit } from '@/database/index';
import mongoose from 'mongoose';

// Type for breed/cage options
export interface IBreedOption {
  _id: string;
  name: string;
}

export interface ICageOption {
  _id: string;
  name: string;
  cage_type: string;
}

/**
 * Fetches all Rabbit data for a specific user, populates related fields, and transforms it
 * into the structure required for the data table.
 * @param userId - The ID of the user whose rabbits to fetch
 */
export async function getRabbitsForTable(userId: string): Promise<RabbitTableData[]> {
  try {
    // 1. Connect to the database
    await connectDB();

    // 2. Fetch Rabbits with necessary population, filtered by user_id
    // The select and lean methods optimize the query performance.
    // const rabbits = await RabbitModel.find({ status: { $ne: 'Sold' } }) // Exclude 'Sold' for a cleaner view
    const rabbits = await RabbitModel.find({ user_id: userId })
  // 1. Select the correct field name: `current_cage_id`
  .select('ear_tag_id name gender date_of_birth status is_pregnant breed_id current_cage_id')
  .populate<{ breed_id: IBreed }>('breed_id', 'name')
  // 2. Populate the correct path (`current_cage_id`) and select the correct field (`name`) from the Cage model.
  .populate<{ current_cage_id: ICage }>('current_cage_id', 'name') 
  .sort({ date_of_birth: 1, createdAt: -1 })
  .lean()
  .exec();
      
    // 3. Transform data using Mongoose virtuals
    const transformedData: RabbitTableData[] = rabbits.map(rabbit => {
      
      // Instantiate a Mongoose Document to access virtuals that are not automatically
      // calculated in a .lean() query or simple aggregation.
      // This is necessary because age_in_days and maturity_status rely on Date.now().
      const rabbitDoc = new RabbitModel(rabbit);

      // Extract populated field names (checking if they were actually populated)
      const breedName = (rabbit.breed_id as IBreed)?.name ?? 'Unknown';
      // 3. Extract the populated value from the correct path and property name
      const cageName = (rabbit.current_cage_id as ICage)?.name ?? 'N/A';
      
      return {
        _id: rabbit._id.toString(),
        // FIX: Change 'tag_id' to 'ear_tag_id' to access the correct property from the database result
        tag_id: rabbit.ear_tag_id,
        // Virtuals
        full_name: rabbitDoc.full_name,
        age_in_days: rabbitDoc.age_in_days,
        maturity_status: rabbitDoc.maturity_status,
        // Direct fields
        gender: rabbit.gender,
        status: rabbit.status,
        is_pregnant: rabbit.is_pregnant,
        // Populated fields
        breed_name: breedName,
        // The table output field is called `cage_id`
        cage_id: cageName,
      };
    });

    return transformedData;

  } catch (error) {
    console.error('Failed to fetch rabbit data for table:', error);
    // In a real app, you would handle this error more gracefully
    throw new Error('Database fetch failed');
  }
}

/**
 * Fetches all available breeds for a specific user for dropdown/form selection
 * @param userId - The ID of the user whose breeds to fetch
 */
export async function getBreedsForForm(userId: string): Promise<IBreedOption[]> {
  try {
    await connectDB();

    const breeds = await BreedModel.find({ user_id: userId })
      .select('_id name')
      .sort({ name: 1 })
      .lean()
      .exec();

    return breeds.map((breed) => ({
      _id: breed._id.toString(),
      name: breed.name,
    }));
  } catch (error) {
    console.error('Failed to fetch breeds for form:', error);
    throw new Error('Failed to fetch breeds');
  }
}

/**
 * Fetches all available cages for a specific user for dropdown/form selection
 * @param userId - The ID of the user whose cages to fetch
 */
export async function getCagesForForm(userId: string): Promise<ICageOption[]> {
  try {
    await connectDB();

    const cages = await CageModel.find({ user_id: userId })
      .select('_id name cage_type')
      .sort({ name: 1 })
      .lean()
      .exec();

    return cages.map((cage) => ({
      _id: cage._id.toString(),
      name: cage.name,
      cage_type: cage.cage_type,
    }));
  } catch (error) {
    console.error('Failed to fetch cages for form:', error);
    throw new Error('Failed to fetch cages');
  }
}

/**
 * Fetches all Breeding data for a specific user, populates related rabbit information, and transforms it
 * into the structure required for the breeding data table.
 * @param userId - The ID of the user whose breedings to fetch
 */
export async function getBreedingsForTable(userId: string): Promise<BreedingTableData[]> {
  try {
    await connectDB();

    const breedings = await BreedingModel.find({ user_id: userId })
      .select('doe_id buck_id mating_date expected_kindling_date is_successful litter_id')
      .populate('doe_id', 'ear_tag_id name')
      .populate('buck_id', 'ear_tag_id name')
      .sort({ mating_date: -1 })
      .lean()
      .exec();

    const transformedData: BreedingTableData[] = breedings.map((breeding: any) => {
      const matingDate = new Date(breeding.mating_date);
      const today = new Date();
      const daysSinceMating = Math.floor((today.getTime() - matingDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        _id: breeding._id.toString(),
        doe_name: breeding.doe_id?.name || breeding.doe_id?.ear_tag_id || 'Unknown Doe',
        buck_name: breeding.buck_id?.name || breeding.buck_id?.ear_tag_id || 'Unknown Buck',
        mating_date: breeding.mating_date,
        expected_kindling_date: breeding.expected_kindling_date,
        is_successful: breeding.is_successful,
        litter_id: breeding.litter_id ? breeding.litter_id.toString() : null,
        days_since_mating: daysSinceMating,
        status: breeding.is_successful ? 'Successful' : daysSinceMating > 35 ? 'Failed' : 'Pending',
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch breeding data for table:', error);
    throw new Error('Database fetch failed');
  }
}

/**
 * Fetches all available rabbits for a specific user for dropdown/form selection (for breeding, litters, etc.)
 * @param userId - The ID of the user whose rabbits to fetch
 */
export async function getRabbitsForForm(userId: string): Promise<IRabbitOption[]> {
  try {
    await connectDB();

    const rabbits = await RabbitModel.find({ user_id: userId })
      .select('_id ear_tag_id name gender')
      .sort({ ear_tag_id: 1 })
      .lean()
      .exec();

    return rabbits.map((rabbit: any) => ({
      _id: rabbit._id.toString(),
      ear_tag_id: rabbit.ear_tag_id,
      name: rabbit.name,
      gender: rabbit.gender,
    }));
  } catch (error) {
    console.error('Failed to fetch rabbits for form:', error);
    throw new Error('Failed to fetch rabbits');
  }
}

// Type for rabbit options
export interface IRabbitOption {
  _id: string;
  ear_tag_id: string;
  name: string | null;
  gender: string;
}

/**
 * Fetches all breedings for a specific user for dropdown/form selection (for litter management)
 * @param userId - The ID of the user whose breedings to fetch
 */
export async function getBreedingsForForm(userId: string): Promise<IBreedingOption[]> {
  try {
    await connectDB();

    const breedings = await BreedingModel.find({ user_id: userId })
      .select('_id doe_id buck_id mating_date')
      .populate('doe_id', 'ear_tag_id name')
      .populate('buck_id', 'ear_tag_id name')
      .sort({ mating_date: -1 })
      .lean()
      .exec();

    return breedings.map((breeding: any) => ({
      _id: breeding._id.toString(),
      doe_name: breeding.doe_id?.name || breeding.doe_id?.ear_tag_id || 'Unknown',
      buck_name: breeding.buck_id?.name || breeding.buck_id?.ear_tag_id || 'Unknown',
      mating_date: breeding.mating_date,
    }));
  } catch (error) {
    console.error('Failed to fetch breedings for form:', error);
    throw new Error('Failed to fetch breedings');
  }
}

// Type for breeding options
export interface IBreedingOption {
  _id: string;
  doe_name: string;
  buck_name: string;
  mating_date: Date;
}

export async function getLittersForTable(userId: string): Promise<LitterTableData[]> {
  try {
    await connectDB();

    const litters = await LitterModel.find({ user_id: userId })
      .select('breeding_id doe_id buck_id kindling_date total_kits_born kits_surviving current_kits_count weaning_date status')
      .populate('doe_id', 'ear_tag_id name')
      .populate('buck_id', 'ear_tag_id name')
      .sort({ kindling_date: -1 })
      .lean()
      .exec();

    const transformedData: LitterTableData[] = litters.map((litter: any) => {
      const kindlingDate = new Date(litter.kindling_date);
      const today = new Date();
      const daysOld = Math.floor((today.getTime() - kindlingDate.getTime()) / (1000 * 60 * 60 * 24));
      const survivalRate = litter.total_kits_born > 0 
        ? (litter.kits_surviving / litter.total_kits_born) * 100 
        : 0;

      return {
        _id: litter._id.toString(),
        breeding_id: litter.breeding_id.toString(),
        doe_name: litter.doe_id?.name || litter.doe_id?.ear_tag_id || 'Unknown Doe',
        buck_name: litter.buck_id?.name || litter.buck_id?.ear_tag_id || 'Unknown Buck',
        kindling_date: litter.kindling_date,
        total_kits_born: litter.total_kits_born,
        kits_surviving: litter.kits_surviving,
        current_kits_count: litter.current_kits_count,
        weaning_date: litter.weaning_date,
        status: litter.status,
        days_old: daysOld,
        survival_rate: survivalRate,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch litter data for table:', error);
    throw new Error('Database fetch failed');
  }
}

/**
 * Fetches all Health Records for a specific user, populates rabbit and disease information,
 * and transforms it into the structure required for the health data table.
 * @param userId - The ID of the user whose health records to fetch
 */
export async function getHealthRecordsForTable(userId: string): Promise<HealthRecordTableData[]> {
  try {
    await connectDB();

    const healthRecords = await HealthRecordModel.find({ user_id: userId })
      .select('rabbit_id disease_id date_of_diagnosis treatment_start_date treatment_end_date quarantined notes')
      .populate<{ rabbit_id: IRabbit }>('rabbit_id', 'ear_tag_id name')
      .populate<{ disease_id: IDisease }>('disease_id', 'name')
      .sort({ date_of_diagnosis: -1 })
      .lean()
      .exec();

    const today = new Date();
    const transformedData: HealthRecordTableData[] = healthRecords.map((record: any) => {
      const diagnosisDate = new Date(record.date_of_diagnosis);
      const treatmentStartDate = new Date(record.treatment_start_date);
      const treatmentEndDate = record.treatment_end_date ? new Date(record.treatment_end_date) : null;
      
      // Calculate days since diagnosis
      const daysSinceDiagnosis = Math.floor((today.getTime() - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate treatment duration
      const treatmentDurationDays = treatmentEndDate
        ? Math.floor((treatmentEndDate.getTime() - treatmentStartDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Determine if record is active (ongoing treatment)
      const isActive = treatmentEndDate === null;

      // Determine current status
      let currentStatus: 'Sick' | 'Quarantined' | 'Treated' | 'Resolved';
      if (isActive) {
        currentStatus = record.quarantined ? 'Quarantined' : 'Sick';
      } else {
        currentStatus = treatmentEndDate && treatmentEndDate < today ? 'Resolved' : 'Treated';
      }

      const rabbitDoc = (record.rabbit_id as IRabbit);
      const diseaseDoc = (record.disease_id as IDisease);

      return {
        _id: record._id.toString(),
        rabbit_id: rabbitDoc._id.toString(),
        rabbit_tag_id: rabbitDoc.ear_tag_id,
        rabbit_full_name: rabbitDoc.name ? `${rabbitDoc.ear_tag_id} - ${rabbitDoc.name}` : rabbitDoc.ear_tag_id,
        disease_id: diseaseDoc._id.toString(),
        disease_name: diseaseDoc.name,
        date_of_diagnosis: record.date_of_diagnosis,
        treatment_start_date: record.treatment_start_date,
        treatment_end_date: record.treatment_end_date,
        quarantined: record.quarantined,
        notes: record.notes,
        is_active: isActive,
        current_status: currentStatus,
        days_since_diagnosis: daysSinceDiagnosis,
        treatment_duration_days: treatmentDurationDays,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch health records for table:', error);
    throw new Error('Database fetch failed');
  }
}

/**
 * Fetches all available diseases for a specific user for dropdown/form selection
 * @param userId - The ID of the user whose diseases to fetch
 */
export async function getDiseasesForForm(userId: string) {
  try {
    await connectDB();

    const diseases = await DiseaseModel.find({ user_id: userId })
      .select('_id name is_quarantinable')
      .sort({ name: 1 })
      .lean()
      .exec();

    return diseases.map((disease) => ({
      _id: disease._id.toString(),
      name: disease.name,
      is_quarantinable: disease.is_quarantinable,
    }));
  } catch (error) {
    console.error('Failed to fetch diseases for form:', error);
    throw new Error('Failed to fetch diseases');
  }
}

/**
 * Fetches health statistics for a specific user for the health dashboard
 * @param userId - The ID of the user whose health stats to fetch
 */
export async function getHealthStats(userId: string) {
  try {
    await connectDB();

    // Get currently sick/quarantined rabbits (active health records)
    const activeSickRecords = await HealthRecordModel.find({
      user_id: userId,
      treatment_end_date: null
    })
      .select('rabbit_id quarantined')
      .lean()
      .exec();

    // Get unique rabbits
    const uniqueSickRabbits = new Set(activeSickRecords.map(r => r.rabbit_id.toString()));
    
    // Count quarantined
    const quarantinedCount = activeSickRecords.filter(r => r.quarantined).length;

    return {
      total_sick: uniqueSickRabbits.size,
      quarantined: quarantinedCount,
      active_records: activeSickRecords.length,
    };
  } catch (error) {
    console.error('Failed to fetch health stats:', error);
    throw new Error('Failed to fetch health stats');
  }
}

/**
 * Validate if an ear_tag_id is unique for a given user
 * Useful for form-level validation and API requests
 */
export async function isEarTagIdUnique(userId: string, earTagId: string, excludeId?: string): Promise<boolean> {
  try {
    await connectDB();

    const query: Record<string, unknown> = {
      user_id: userId,
      ear_tag_id: earTagId,
    };

    if (excludeId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    const existing = await RabbitModel.findOne(query).select('_id').lean();
    return !existing;
  } catch (error) {
    console.error('Failed to check ear tag uniqueness:', error);
    return false;
  }
}

/**
 * Get rabbit by ID with fully populated references
 * Used for detail views and API responses
 */
export async function getRabbitById(userId: string, rabbitId: string) {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(rabbitId)) {
      return null;
    }

    const rabbit = await RabbitModel.findOne({
      _id: new mongoose.Types.ObjectId(rabbitId),
      user_id: userId,
    })
      .select(
        'ear_tag_id name gender date_of_birth status is_pregnant breed_id current_cage_id parent_doe_id parent_buck_id source_type source_farm createdAt updatedAt'
      )
      .populate('breed_id', 'name')
      .populate('current_cage_id', 'name cage_type')
      .populate('parent_doe_id', 'ear_tag_id name')
      .populate('parent_buck_id', 'ear_tag_id name')
      .lean();

    return rabbit;
  } catch (error) {
    console.error('Failed to fetch rabbit by ID:', error);
    return null;
  }
}

/**
 * Get rabbit statistics for a user
 * Used for dashboard and API responses
 */
export async function getRabbitStats(userId: string) {
  try {
    await connectDB();

    const stats = await RabbitModel.getStats(userId);
    return stats;
  } catch (error) {
    console.error('Failed to fetch rabbit stats:', error);
    return {
      total: 0,
      active: 0,
      bucks: 0,
      does: 0,
    };
  }
}

/**
 * Get rabbits available for breeding (active, opposite gender, not pregnant)
 * Useful for breeding form selection
 */
export async function getBreedingRabbits(userId: string, gender: 'Male' | 'Female') {
  try {
    await connectDB();

    const oppositeGender = gender === 'Male' ? 'Female' : 'Male';

    const rabbits = await RabbitModel.find({
      user_id: userId,
      gender: oppositeGender,
      status: 'Active',
      is_pregnant: gender === 'Female' ? false : undefined,
    })
      .select('ear_tag_id name gender')
      .populate('breed_id', 'name')
      .sort({ ear_tag_id: 1 })
      .lean();

    return rabbits.map(r => ({
      _id: r._id.toString(),
      label: r.name ? `${r.ear_tag_id} - ${r.name}` : r.ear_tag_id,
      value: r._id.toString(),
    }));
  } catch (error) {
    console.error('Failed to fetch breeding rabbits:', error);
    return [];
  }
}

/**
 * Search rabbits by ear_tag_id or name
 * Used for autocomplete and search functionality
 */
export async function searchRabbits(userId: string, searchTerm: string, limit: number = 10) {
  try {
    await connectDB();

    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length < 2) {
      return [];
    }

    const rabbits = await RabbitModel.find({
      user_id: userId,
      $or: [
        { ear_tag_id: { $regex: trimmedTerm, $options: 'i' } },
        { name: { $regex: trimmedTerm, $options: 'i' } },
      ],
    })
      .select('ear_tag_id name gender status breed_id')
      .populate('breed_id', 'name')
      .limit(limit)
      .lean();

    return rabbits.map(r => ({
      _id: r._id.toString(),
      label: r.name ? `${r.ear_tag_id} - ${r.name}` : r.ear_tag_id,
      value: r._id.toString(),
      gender: r.gender,
      status: r.status,
    }));
  } catch (error) {
    console.error('Failed to search rabbits:', error);
    return [];
  }
}

/**
 * Count rabbits by status for a user
 * Used for dashboard metrics
 */
export async function getRabbitCountByStatus(userId: string) {
  try {
    await connectDB();

    const statusCounts = await RabbitModel.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return Object.fromEntries(statusCounts.map(item => [item._id, item.count]));
  } catch (error) {
    console.error('Failed to fetch status counts:', error);
    return {};
  }
}

/**
 * Check if rabbit is involved in active breedings
 * Used for deletion and status change validations
 */
export async function hasActiveBreedings(rabbitId: string): Promise<boolean> {
  try {
    await connectDB();

    const objectId = new mongoose.Types.ObjectId(rabbitId);
    const count = await BreedingModel.countDocuments({
      $or: [{ buck_id: objectId }, { doe_id: objectId }],
      status: { $ne: 'Failed' },
    });

    return count > 0;
  } catch (error) {
    console.error('Failed to check active breedings:', error);
    return false;
  }
}

/**
 * Fetches available (unused) ear tag IDs from the system for a specific user.
 * In a real system, these would be pre-created tags.
 * For now, returns placeholder tags that aren't yet assigned to rabbits in the user's account.
 * @param userId - The ID of the user whose ear tag IDs to check
 */
export async function getAvailableEarTagIds(userId: string): Promise<{ id: string; label: string }[]> {
  try {
    await connectDB();

    // Get all assigned ear_tag_ids for this user
    const assignedTags = await RabbitModel.find({ user_id: userId })
      .select('ear_tag_id')
      .lean()
      .exec();

    const assignedSet = new Set(assignedTags.map(r => r.ear_tag_id));

    // Generate common ear tag ID patterns based on cage structure
    // Assuming pattern: A-001, A-002, ... A-010, B-001, etc.
    const allPossibleTags: string[] = [];
    const cages = ['A', 'B', 'C', 'D', 'E']; // Common cage sections
    const numbersPerCage = 20; // 20 rabbits per cage section

    for (const cage of cages) {
      for (let i = 1; i <= numbersPerCage; i++) {
        const tagId = `${cage}-${String(i).padStart(3, '0')}`;
        if (!assignedSet.has(tagId)) {
          allPossibleTags.push(tagId);
        }
      }
    }

    // Return available tags formatted for select dropdown
    return allPossibleTags.map(tag => ({
      id: tag,
      label: tag,
    }));
  } catch (error) {
    console.error('Failed to fetch available ear tag IDs:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Fetches all schedules for a specific user with proper population of related data
 * @param userId - The ID of the user whose schedules to fetch
 */
export async function getSchedulesForTable(userId: string) {
  try {
    await connectDB();

    const schedules = await ScheduleModel.find({ user_id: userId })
      .select('target_date type description is_completed related_rabbit_ids related_entity_id createdAt')
      .populate('related_rabbit_ids', 'ear_tag_id name')
      .sort({ target_date: 1, is_completed: 1 })
      .lean()
      .exec();

    // Transform data for table display
    const transformedData = schedules.map((schedule: any) => ({
      _id: schedule._id.toString(),
      target_date: schedule.target_date,
      type: schedule.type,
      description: schedule.description,
      is_completed: schedule.is_completed,
      related_rabbit_ids: schedule.related_rabbit_ids?.map((r: any) => ({
        _id: r._id.toString(),
        ear_tag_id: r.ear_tag_id,
        name: r.name,
      })) || [],
      related_entity_id: schedule.related_entity_id,
      createdAt: schedule.createdAt,
    }));

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch schedules for table:', error);
    throw new Error('Database fetch failed');
  }
}