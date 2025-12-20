import mongoose, { Schema, Model } from 'mongoose';
import { ICull, IRabbit } from './types';

const CullSchema = new Schema<ICull>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    rabbit_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true, unique: true },
    date_culled: { type: Date, required: true },
    reason: { type: String, enum: ['Meat', 'Health', 'Poor Performance', 'Other'], required: true },
}, { timestamps: true });

// Post-Save Middleware to update Rabbit status to Culled
CullSchema.post('save', async function(doc) {
    if (mongoose.models.Rabbit) {
        await mongoose.model<IRabbit>('Rabbit').findByIdAndUpdate(doc.rabbit_id, { status: 'Culled' });
    }
});

export const Cull = (mongoose.models.Cull || mongoose.model<ICull>('Cull', CullSchema)) as Model<ICull>;