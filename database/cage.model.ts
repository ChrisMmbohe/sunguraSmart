import mongoose, { Schema, Model } from 'mongoose';
import { ICage } from './types';

const CageSchema = new Schema<ICage>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    // A1-A12, B1-B12, C1-C12 etc.
    name: { type: String, required: true, trim: true, unique: true }, 
    // Tier A, Tier B, Quarantine Section
    location_area: { type: String, required: true, trim: true }, 
    capacity: { type: Number, required: true, min: 1, default: 1 },
    current_occupants: [{ type: Schema.Types.ObjectId, ref: 'Rabbit', default: [] }],
    cage_type: { 
        type: String, 
        enum: ['Buck', 'Doe', 'Grower', 'Quarantine', 'Nesting'], 
        required: true, 
        index: true 
    },
}, { timestamps: true });

// Index for distribution queries
CageSchema.index({ user_id: 1, cage_type: 1 });

export const Cage = (mongoose.models.Cage || mongoose.model<ICage>('Cage', CageSchema)) as Model<ICage>;