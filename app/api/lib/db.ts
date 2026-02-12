import mongoose from 'mongoose';
import { initModels } from '@/database';

let isConnected: boolean = false;

export async function connectDB() {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri, {
      retryWrites: true,
      w: 'majority',
    });

    isConnected = true;
    
    // Initialize all models
    initModels();
    
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function closeDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  }
}
