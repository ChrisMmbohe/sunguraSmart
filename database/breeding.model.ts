import mongoose, { Schema } from 'mongoose';
import { IBreeding, IBreedingModel, IBreedingSuccessStats } from './types'; // Updated imports

// Using the custom model interface IBreedingModel for the Schema definition
const BreedingSchema = new Schema<IBreeding, IBreedingModel>({ 
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    doe_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true, index: true },
    buck_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    mating_date: { type: Date, required: true },
    expected_kindling_date: { type: Date, required: true },
    is_successful: { type: Boolean, default: false },
    litter_id: { type: Schema.Types.ObjectId, ref: 'Litter', default: null, index: true },
}, { timestamps: true });

BreedingSchema.pre('validate', function(next) {
    // Automation: Calculate expected kindling date (Average gestation is ~31 days)
    if (this.mating_date && !this.expected_kindling_date) {
        const expected = new Date(this.mating_date);
        expected.setDate(expected.getDate() + 31);
        this.expected_kindling_date = expected;
    }
    next();
});

// --- STATIC METHOD: Calculate Breeding Success Rate ---
BreedingSchema.statics.getBreedingSuccess = async function(
    userId: string // FIXED: Type is now strictly string
): Promise<IBreedingSuccessStats> {
    
    // The query now works correctly by matching the string userId to the String schema type.
    // 1. Count total breeding attempts for the user
    const totalBreedingAttempts = await this.countDocuments({ user_id: userId });
    
    // 2. Count breedings that resulted in a successful kindling (is_successful: true)
    const successfulKindlings = await this.countDocuments({ user_id: userId, is_successful: true });

    let kindlingRatePct = 0;
    if (totalBreedingAttempts > 0) {
        // Calculate the percentage
        kindlingRatePct = (successfulKindlings / totalBreedingAttempts) * 100;
    }

    return { 
        kindling_rate_pct: kindlingRatePct,
        total_attempts: totalBreedingAttempts,
        successful_kindlings: successfulKindlings
    };
};

// Export the model, casting it to the IBreedingModel interface
export const Breeding = (
    mongoose.models.Breeding || mongoose.model<IBreeding, IBreedingModel>('Breeding', BreedingSchema)
) as IBreedingModel;