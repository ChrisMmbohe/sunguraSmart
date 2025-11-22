import mongoose from 'mongoose';
import * as Models from '@/database/index'; // <-- Import ALL your models bundle

// Extend the global object with mongoose cache type
declare global {
  
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

// Retrieve MongoDB URI from environment variables
const MONGODB_URI: string = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Initialize global cache for connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Helper function to force load all model files
function loadModels() {
  // Accessing the Models object exported by index.ts forces 
  // all module imports (and thus, model registrations) to execute.
  if (Object.keys(mongoose.models).length === 0) {
    console.log('--- Registering Mongoose Models ---');
    // Using 'void' to access the object without lint warnings
    // The side effect (module execution) is what we need.
    void Models; 
  }
}

/**
 * Establishes and returns a cached MongoDB connection using Mongoose.
 * * In development, Next.js hot-reloading can create multiple connections.
 * This function caches the connection globally to prevent connection exhaustion.
 * * @returns {Promise<mongoose.Connection>} The active MongoDB connection
 */
async function connectDB(): Promise<mongoose.Connection> {
  // Return existing connection if already established
  if (cached.conn) {
    // 💡 CRITICAL: Ensure models are loaded even if connection is cached, 
    // in case of hot-reloading or import order issues.
    loadModels();
    return cached.conn;
  }

  // Create new connection promise if one doesn't exist
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Disable command buffering for better error handling
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      // Load models immediately after connection success
      loadModels(); 
      return mongooseInstance.connection;
    });
  }

  try {
    // Wait for the connection promise to resolve
    cached.conn = await cached.promise;
    // Final check after connection establishment
    loadModels();
  } catch (error) {
    // Reset promise on connection failure to allow retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;