import mongoose, { Schema, Model } from 'mongoose';
import { IDeath, IRabbit } from './types';

const DeathSchema = new Schema<IDeath>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    rabbit_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true, unique: true },
    date_of_death: { type: Date, required: true },
    cause_of_death: { type: String, required: true },
}, { timestamps: true });

// Post-Save Middleware to update Rabbit status to Deceased
DeathSchema.post('save', async function(doc) {
    if (mongoose.models.Rabbit) {
        await mongoose.model<IRabbit>('Rabbit').findByIdAndUpdate(doc.rabbit_id, { status: 'Deceased' });
    }
});

export const Death = (mongoose.models.Death || mongoose.model<IDeath>('Death', DeathSchema)) as Model<IDeath>;