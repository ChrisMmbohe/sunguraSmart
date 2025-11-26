// database/cage.model.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import Rabbit from '@/database/rabbit.model'; // We'll create this soon

export interface ICage extends Document {
  cage_id: string;
  capacity: number;
  location: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  occupancy: number;        // ← number of rabbits currently in this cage
  available_slots: number;  // ← capacity - occupancy
  is_full: boolean;
}

interface ICageModel extends Model<ICage> {
  // Optional static methods later
}

const cageSchema = new Schema<ICage, ICageModel>(
  {
    cage_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // Standardize format
    },
    capacity: {
      type: Number,
      default: 1,
      min: [1, 'Capacity must be at least 1'],
    },
    location: {
      type: String,
      default: null,
      trim: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    // Ensure virtuals are serialized even when not explicitly populated
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true },
  }
);

// ──────────────────────────────────────────────────────
// Virtuals for Occupancy, Slots, and Full Status
// ──────────────────────────────────────────────────────

/**
 * ⚠️ CRITICAL NOTE:
 * These virtuals (occupancy, available_slots, is_full) depend on Virtual Populate.
 * They will ONLY contain correct values if the query explicitly uses:
 * .populate('occupancy')
 * Failure to populate 'occupancy' will cause available_slots and is_full
 * to rely on a null/undefined occupancy, leading to incorrect calculations.
 */
cageSchema.virtual('occupancy', {
  ref: 'Rabbit',
  localField: '_id',
  foreignField: 'cage_id',
  count: true, // Returns count instead of documents
});

cageSchema.virtual('available_slots').get(function () {
  // occupancy will be 0 if unpopulated or if there are no rabbits
  return this.capacity - (this.occupancy || 0);
});

cageSchema.virtual('is_full').get(function () {
  // occupancy will be 0 if unpopulated or if there are no rabbits
  return (this.occupancy || 0) >= this.capacity;
});

// Indexes
//cageSchema.index({ cage_id: 1 });

const Cage = (mongoose.models.Cage as ICageModel) ||
  mongoose.model<ICage, ICageModel>('Cage', cageSchema);

export default Cage;