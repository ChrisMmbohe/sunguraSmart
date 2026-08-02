import 'server-only';
import mongoose, { Mongoose } from 'mongoose';

/**
 * Next.js reloads modules on every request in dev, which would otherwise
 * create a new Mongoose connection per request. We cache the connection
 * (and the in-flight connect promise) on the global object so it survives
 * hot reloads and is reused across serverless invocations in the same
 * execution context.
 */
interface CachedConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: CachedConnection | undefined;
}

const cached: CachedConnection = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

export async function dbConnect(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  // Checked lazily (inside the function) rather than at module load time.
  // Model files re-export enums alongside Mongoose models from the same
  // barrel, so this module can end up imported into a client bundle by
  // mistake; a top-level throw there would crash the whole page on
  // import alone. Only an actual dbConnect() call should fail loudly.
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error(
      'Missing MONGODB_URI environment variable. Add it to .env.local before calling dbConnect().'
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
