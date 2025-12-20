import mongoose, { Schema, Model } from 'mongoose';
import { ILitter, ILitterWeightLog } from './types';

// --- Sub-document Schema for Litter Weight Monitoring ---
const LitterWeightLogSchema = new Schema<ILitterWeightLog>({
    measurement_date: { type: Date, required: true },
    total_litter_weight_kg: { type: Number, required: true, min: 0 },
}, { _id: false }); // Embedded sub-document

const LitterSchema = new Schema<ILitter>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    breeding_id: { type: Schema.Types.ObjectId, ref: 'Breeding', required: true, index: true },
    kindling_date: { type: Date, required: true },
    doe_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    buck_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    total_kits_born: { type: Number, required: true, min: 0 },
    kits_surviving: { type: Number, required: true, min: 0 },
    weaning_date: { type: Date, default: null },
    // Allow monitoring of litter weight monitoring up to weaning stage
    litter_weight_logs: { type: [LitterWeightLogSchema], default: [] }, 
}, { timestamps: true });

LitterSchema.index({ user_id: 1, kindling_date: -1 });

export const Litter = (mongoose.models.Litter || mongoose.model<ILitter>('Litter', LitterSchema)) as Model<ILitter>;