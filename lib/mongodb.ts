import mongoose from 'mongoose';

// Extend the global object with mongoose cache type
declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

// Retrieve MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Initialize global cache for connection
// This prevents multiple connections during development hot-reloading
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Establishes and returns a cached MongoDB connection using Mongoose.
 * 
 * In development, Next.js hot-reloading can create multiple connections.
 * This function caches the connection globally to prevent connection exhaustion.
 * 
 * @returns {Promise<mongoose.Connection>} The active MongoDB connection
 */
async function connectDB(): Promise<mongoose.Connection> {
  // Return existing connection if already established
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if one doesn't exist
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false, // Disable command buffering for better error handling
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance.connection;
    });
  }

  try {
    // Wait for the connection promise to resolve
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset promise on connection failure to allow retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
