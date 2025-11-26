// lib/data-fetcher.ts

import connectDB from '@/lib/mongodb';
import RabbitModel from '@/database/rabbit.model';
import { RabbitTableData } from '@/app/rabbits/types';
import { IBreed, ICage } from '@/database/index';
import mongoose from 'mongoose';

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
      .select('tag_id name gender date_of_birth status is_pregnant breed_id cage_id')
      .populate<{ breed_id: IBreed }>('breed_id', 'name') // Populate breed_id with only the 'name' field
      .populate<{ cage_id: ICage }>('cage_id', 'cage_id') // Populate cage_id with only the 'cage_id' field
      // ✅ FIX: Combined the two .sort() calls into one. 
      // Sorts primarily by date_of_birth (oldest first), then secondarily by createdAt (newest first).
      .sort({ date_of_birth: 1, createdAt: -1 }) 
      .lean() // Return plain JavaScript objects for performance
      .exec();
      
    // 3. Transform data using Mongoose virtuals
    const transformedData: RabbitTableData[] = rabbits.map(rabbit => {
      
      // Instantiate a Mongoose Document to access virtuals that are not automatically
      // calculated in a .lean() query or simple aggregation.
      // This is necessary because age_in_days and maturity_status rely on Date.now().
      const rabbitDoc = new RabbitModel(rabbit);

      // Extract populated field names (checking if they were actually populated)
      const breedName = (rabbit.breed_id as IBreed)?.name ?? 'Unknown';
      const cageId = (rabbit.cage_id as ICage)?.cage_id ?? 'N/A';
      
      return {
        _id: rabbit._id.toString(),
        tag_id: rabbit.tag_id,
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
        cage_id: cageId,
      };
    });

    return transformedData;

  } catch (error) {
    console.error('Failed to fetch rabbit data for table:', error);
    // In a real app, you would handle this error more gracefully
    throw new Error('Database fetch failed');
  }
}