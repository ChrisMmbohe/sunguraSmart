import mongoose, { Schema } from 'mongoose';
import { IBreeding, IBreedingModel, IBreedingSuccessStats } from './types';

const BreedingSchema = new Schema<IBreeding, IBreedingModel>({ 
    user_id: { type: String, required: true, index: true },
    doe_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true, index: true },
    buck_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
    mating_date: { type: Date, required: true },
    expected_kindling_date: { type: Date, required: true },
    is_successful: { type: Boolean, default: false },
    litter_id: { type: Schema.Types.ObjectId, ref: 'Litter', default: null, index: true },
}, { timestamps: true });

// --- Automation: Calculate Expected Kindling Date ---
BreedingSchema.pre('validate', function(next) {
    if (this.mating_date && !this.expected_kindling_date) {
        const expected = new Date(this.mating_date);
        expected.setDate(expected.getDate() + 31);
        this.expected_kindling_date = expected;
    }
    next();
});

/**
 * --- AUTOMATION: Create Litter on Success ---
 * This post-save middleware ensures that if a breeding is marked successful,
 * a placeholder litter is created if one doesn't exist.
 */
BreedingSchema.post('save', async function(doc) {
    if (doc.is_successful && !doc.litter_id) {
        try {
            const Litter = mongoose.model('Litter');
            
            // Create a default litter record linked to this breeding
            const newLitter = await Litter.create({
                user_id: doc.user_id,
                breeding_id: doc._id,
                kindling_date: doc.expected_kindling_date, // Default to expected date
                doe_id: doc.doe_id,
                buck_id: doc.buck_id,
                total_kits_born: 0, // To be updated by user later
                kits_surviving: 0,
                status: 'Active'
            });

            // Update the breeding record with the new litter_id (using findOneAndUpdate to avoid re-triggering middleware loop)
            await mongoose.model('Breeding').findOneAndUpdate(
                { _id: doc._id },
                { $set: { litter_id: newLitter._id } }
            );
        } catch (error) {
            console.error('Failed to auto-create litter:', error);
        }
    }
});

// --- Statics: KPI Calculations ---
BreedingSchema.statics.getSuccessStats = async function(userId: string): Promise<IBreedingSuccessStats> {
    const totalBreedingAttempts = await this.countDocuments({ user_id: userId });
    const successfulKindlings = await this.countDocuments({ user_id: userId, is_successful: true });

    let kindlingRatePct = 0;
    if (totalBreedingAttempts > 0) {
        kindlingRatePct = (successfulKindlings / totalBreedingAttempts) * 100;
    }

    const litterStats = await mongoose.model('Litter').aggregate([
        { $match: { user_id: userId } },
        { 
            $group: {
                _id: null,
                totalKitsBorn: { $sum: "$total_kits_born" },
                totalKitsSurviving: { $sum: "$kits_surviving" },
                avgLitterSize: { $avg: "$total_kits_born" }
            }
        }
    ]);

    let weaningSurvivalRatePct = 0;
    let avgLitterSize = 0;

    if (litterStats.length > 0) {
        const stats = litterStats[0];
        avgLitterSize = stats.avgLitterSize || 0;
        if (stats.totalKitsBorn > 0) {
            weaningSurvivalRatePct = (stats.totalKitsSurviving / stats.totalKitsBorn) * 100;
        }
    }

    return { 
        kindling_rate_pct: kindlingRatePct,
        weaning_survival_rate_pct: weaningSurvivalRatePct,
        avg_litter_size: avgLitterSize
    };
};

export const Breeding = mongoose.models.Breeding || mongoose.model<IBreeding, IBreedingModel>('Breeding', BreedingSchema);