import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICage extends Document {
  cage_id: string;
  capacity: number;
  location: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  occupancy: number;
}

interface ICageModel extends Model<ICage> {}

const cageSchema = new Schema<ICage, ICageModel>(
  {
    cage_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    location: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Validate capacity is positive
cageSchema.pre('save', function (next) {
  if (this.capacity <= 0) {
    return next(new Error('Capacity must be greater than 0'));
  }
  next();
});

// Virtual: Occupancy placeholder - will be populated via aggregation with Rabbit model
// Real-time checks can query Rabbit.countDocuments({ cage_id: this._id, status: 'Active' })
cageSchema.virtual('occupancy').get(function () {
  // Placeholder - implement via aggregation pipeline in routes/controllers
  return 0;
});

// Indexes
cageSchema.index({ cage_id: 1 });

cageSchema.set('toJSON', { virtuals: true });
cageSchema.set('toObject', { virtuals: true });

const Cage = (mongoose.models.Cage as ICageModel) || mongoose.model<ICage, ICageModel>('Cage', cageSchema);

export default Cage;
