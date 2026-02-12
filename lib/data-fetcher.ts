// lib/data-fetcher.ts

import connectDB from '@/lib/mongodb';
import { Rabbit as RabbitModel } from '@/database/rabbit.model'; // ✅ Fix: Use named import 'Rabbit' and rename it to 'RabbitModel'
import { Breed as BreedModel } from '@/database/breed.model';
import { Cage as CageModel } from '@/database/cage.model';
import { Breeding as BreedingModel } from '@/database/breeding.model';
import { Litter as LitterModel } from '@/database/litter.model';
import { HealthRecord as HealthRecordModel } from '@/database/health-record.model';
import { Disease as DiseaseModel } from '@/database/disease.model';
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
 * Fetches all Rabbit data, populates related fields, and transforms it
 * into the structure required for the data table.
 */
export async function getRabbitsForTable(): Promise<RabbitTableData[]> {
  try {
    // 1. Connect to the database
    await connectDB();

    // 2. Fetch Rabbits with necessary population
    // The select and lean methods optimize the query performance.
    // const rabbits = await RabbitModel.find({ status: { $ne: 'Sold' } }) // Exclude 'Sold' for a cleaner view
    const rabbits = await RabbitModel.find({})
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
 * Fetches all available breeds for dropdown/form selection
 */
export async function getBreedsForForm(): Promise<IBreedOption[]> {
  try {
    await connectDB();

    const breeds = await BreedModel.find({})
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
 * Fetches all available cages for dropdown/form selection
 */
export async function getCagesForForm(): Promise<ICageOption[]> {
  try {
    await connectDB();

    const cages = await CageModel.find({})
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
 * Fetches all Breeding data, populates related rabbit information, and transforms it
 * into the structure required for the breeding data table.
 */
export async function getBreedingsForTable(): Promise<BreedingTableData[]> {
  try {
    await connectDB();

    const breedings = await BreedingModel.find({})
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
 * Fetches all available rabbits for dropdown/form selection (for breeding, litters, etc.)
 */
export async function getRabbitsForForm(): Promise<IRabbitOption[]> {
  try {
    await connectDB();

    const rabbits = await RabbitModel.find({})
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
 * Fetches all breedings for dropdown/form selection (for litter management)
 */
export async function getBreedingsForForm(): Promise<IBreedingOption[]> {
  try {
    await connectDB();

    const breedings = await BreedingModel.find({})
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

export async function getLittersForTable(): Promise<LitterTableData[]> {
  try {
    await connectDB();

    const litters = await LitterModel.find({})
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
 * Fetches all Health Records, populates rabbit and disease information,
 * and transforms it into the structure required for the health data table.
 */
export async function getHealthRecordsForTable(): Promise<HealthRecordTableData[]> {
  try {
    await connectDB();

    const healthRecords = await HealthRecordModel.find({})
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
 * Fetches all available diseases for dropdown/form selection
 */
export async function getDiseasesForForm() {
  try {
    await connectDB();

    const diseases = await DiseaseModel.find({})
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
 * Fetches health statistics for the health dashboard
 */
export async function getHealthStats() {
  try {
    await connectDB();

    // Get currently sick/quarantined rabbits (active health records)
    const activeSickRecords = await HealthRecordModel.find({
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