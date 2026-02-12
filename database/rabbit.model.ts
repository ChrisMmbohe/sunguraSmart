import mongoose, { Schema} from 'mongoose';
import { IRabbit, IBreed, RabbitStatus, IRabbitModel, IRabbitStats } from './types';

const RabbitSchema = new Schema<IRabbit>({
    user_id: { type: String, required: true, index: true }, // FIXED: Changed from Schema.Types.ObjectId to String
    // Scalable Identifier: Application layer enforces pattern like D-DOEID-SEQ or YYYYMM-SEQ
    ear_tag_id: { type: String, required: true, unique: true, trim: true }, 
    name: { type: String, default: null, trim: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true, index: true },
    date_of_birth: { type: Date, required: true },
    breed_id: { type: Schema.Types.ObjectId, ref: 'Breed', required: true },
    current_cage_id: { type: Schema.Types.ObjectId, ref: 'Cage', index: true, required: true },
    status: {
        type: String,
        enum: ['Kit', 'Weaner', 'Grower', 'Active', 'Sick', 'Quarantined', 'Culled', 'Deceased', 'Sold'],
        default: 'Kit',
        index: true
    },
    // SOURCE OF RABBITS fields
    source_type: { type: String, enum: ['Born', 'Purchased', 'Gifted'], required: true, default: 'Born' },
    source_farm: { type: String, default: null }, // Seller or Gifting Farm
    parent_doe_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null, index: true },
    parent_buck_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null, index: true },
    // ✅ FIX: Added the field/virtual for pregnancy status
    is_pregnant: { type: Boolean, default: false },
    // Photo URL field
    photo_url: { type: String, default: null, trim: true },
}, { timestamps: true, toJSON: { virtuals: true } });

// Virtual for Age calculation
RabbitSchema.virtual('age_in_days').get(function() {
    if (!this.date_of_birth) return 0;
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - this.date_of_birth.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for Full Name (e.g., A1-123 - Bunny)
RabbitSchema.virtual('full_name').get(function() {
    // If a name exists, return Tag ID - Name, otherwise just the Tag ID
    if (this.name) {
        return `${this.ear_tag_id} - ${this.name}`;
    }
    return this.ear_tag_id;
});

// Virtual for Maturity Status
RabbitSchema.virtual('maturity_status').get(function() {
    // This virtual simply reflects the status derived from age, which is calculated in the pre('save') hook.
    switch (this.status) {
        case 'Kit':
        case 'Weaner':
            return 'Immature';
        case 'Grower':
            return 'Growing';
        case 'Active':
            return 'Mature';
        default:
            return 'N/A';
    }
});


/**
 * Static method to fetch key statistics for the rabbit dashboard.
 * Counts rabbits that are NOT marked as terminal (Culled, Deceased, Sold).
 * @param userId The ID of the user whose rabbits to query.
 * @returns An object containing total, active, buck, and doe counts.
 */
RabbitSchema.statics.getStats = async function(userId: string): Promise<IRabbitStats> {
    const nonTerminalStatuses: RabbitStatus[] = ['Kit', 'Weaner', 'Grower', 'Active', 'Sick', 'Quarantined'];
    
    // Base filter for all non-terminal rabbits belonging to the user
    const baseFilter = {
        user_id: userId,
        status: { $in: nonTerminalStatuses }
    };

    try {
        // 1. Total Rabbits (Non-terminal)
        const total = await this.countDocuments(baseFilter);

        // 2. Active Rabbits (Mature, non-terminal)
        const active = await this.countDocuments({
            ...baseFilter,
            status: 'Active'
        });

        // 3. Bucks (Non-terminal)
        const bucks = await this.countDocuments({
            ...baseFilter,
            gender: 'Male'
        });

        // 4. Does (Non-terminal)
        const does = await this.countDocuments({
            ...baseFilter,
            gender: 'Female'
        });

        return {
            total,
            active,
            bucks,
            does
        };
    } catch (error) {
        console.error("Error fetching rabbit statistics:", error);
        // Return zeros on error to prevent API from crashing
        return { total: 0, active: 0, bucks: 0, does: 0 };
    }
};


// Pre-Save Middleware for Automatic Status Update (Growth Stages)
RabbitSchema.pre('save', async function(next) {
    const doc = this as IRabbit & mongoose.Document;

    // Terminal or Override statuses skip growth calculation
    const terminalOrOverrideStatuses: RabbitStatus[] = ['Sick', 'Quarantined', 'Culled', 'Deceased', 'Sold'];

    if (doc.isModified('date_of_birth') || doc.isNew || !terminalOrOverrideStatuses.includes(doc.status)) {
        const ageDays = doc.age_in_days;

        // Fetch breed growth stages (Business Rule)
        const breedStages = { maturity: 150, weaning: 30, grower: 60 };
        try {
            if (doc.breed_id && mongoose.models.Breed) {
                const breed = await mongoose.model<IBreed>('Breed').findById(doc.breed_id).select('maturity_age_days weaning_age_days grower_age_days').lean();
                if (breed) {
                    breedStages.maturity = breed.maturity_age_days;
                    breedStages.weaning = breed.weaning_age_days;
                    breedStages.grower = breed.grower_age_days;
                }
            }
        } catch (error) {
            console.error("Error fetching breed for status update:", error);
        }

        let newStatus: RabbitStatus = 'Kit'; // Default

        if (ageDays >= breedStages.maturity) {
            newStatus = 'Active'; // Mature rabbit
        } else if (ageDays >= breedStages.grower) {
            newStatus = 'Grower'; // 60 days up to maturity
        } else if (ageDays >= breedStages.weaning) {
            newStatus = 'Weaner'; // 30-59 days
        } else {
            newStatus = 'Kit'; // 0-29 days
        }
        
        // Only update the status if the current status is a growth stage, 
        // ensuring 'Sick' or 'Quarantined' status is maintained until cleared.
        if (['Kit', 'Weaner', 'Grower', 'Active'].includes(doc.status) || doc.isNew) {
             doc.status = newStatus;
        }
    }

    next();
});

RabbitSchema.index({ user_id: 1, status: 1 });
RabbitSchema.index({ user_id: 1, ear_tag_id: 1 });

// Cast the model to the extended interface IRabbitModel
export const Rabbit = (mongoose.models.Rabbit || mongoose.model<IRabbit, IRabbitModel>('Rabbit', RabbitSchema)) as IRabbitModel;