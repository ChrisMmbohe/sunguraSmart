import mongoose, { Schema } from 'mongoose';
// Import the new model interface
import { IHealthRecord, IRabbit, RabbitStatus, IHealthRecordModel } from './types';

const HealthRecordSchema = new Schema<IHealthRecord>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    rabbit_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true, index: true },
    disease_id: { type: Schema.Types.ObjectId, ref: 'Disease', required: true },
    date_of_diagnosis: { type: Date, required: true },
    treatment_start_date: { type: Date, required: true },
    treatment_end_date: { type: Date, default: null }, // Null if ongoing
    quarantined: { type: Boolean, default: false },
    notes: { type: String, default: null },
}, { timestamps: true });

/**
 * Static method to count the number of unique rabbits with active (ongoing) health records.
 * @param userId The ID of the user whose records to check.
 * @returns The count of unique sick/quarantined rabbits.
 */
HealthRecordSchema.statics.getSickCount = async function(userId: string): Promise<number> {
    // Aggregation pipeline to find unique rabbits with an active health record.
    const uniqueSickRabbits = await this.aggregate([
        // 1. Filter by user and where the treatment has not ended (treatment_end_date is null)
        { $match: { user_id: userId, treatment_end_date: null } },
        // 2. Group by rabbit_id to get only unique sick rabbits
        { $group: { _id: '$rabbit_id' } },
        // 3. Count the number of unique rabbits
        { $count: 'sickCount' }
    ]);

    // The result is an array [{ sickCount: X }] or empty if no results
    return uniqueSickRabbits.length > 0 ? uniqueSickRabbits[0].sickCount : 0;
};


// Post-Save Middleware to update Rabbit status to Sick/Quarantined
HealthRecordSchema.post('save', async function(doc) {
    if (mongoose.models.Rabbit) {
        const RabbitModel = mongoose.model<IRabbit>('Rabbit');

        // Only set status if the health record is current (no end date)
        if (!doc.treatment_end_date) {
            const status: RabbitStatus = doc.quarantined ? 'Quarantined' : 'Sick';
            await RabbitModel.findByIdAndUpdate(doc.rabbit_id, { status: status });
        } else {
             // If treatment ended, the status should be reset by application logic, 
             // but we rely on the Rabbit pre-save hook to re-evaluate growth status.
        }
    }
});

// Use the IHealthRecordModel interface for the exported model
export const HealthRecord = (mongoose.models.HealthRecord || mongoose.model<IHealthRecord, IHealthRecordModel>('HealthRecord', HealthRecordSchema)) as IHealthRecordModel;