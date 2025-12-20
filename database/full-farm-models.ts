// All Interfaces and Schemas combined into a single file.

import mongoose, { Schema, Document, Model, Types } from 'mongoose';

// --- GLOBAL UTILITY TYPES AND ENUMS ---

/** Status changes: Kit -> Weaner -> Grower -> Active (age-based) | Sick/Quarantined (health-based) | Culled/Deceased/Sold (terminal) */
export type RabbitStatus = 'Kit' | 'Weaner' | 'Grower' | 'Active' | 'Sick' | 'Quarantined' | 'Culled' | 'Deceased' | 'Sold';
export type RabbitSourceType = 'Born' | 'Purchased' | 'Gifted';
export type SaleItemType = 'Rabbit' | 'ByProduct' | 'Other';
export type ByProductType = 'Manure' | 'Urine' | 'Pelts' | 'Other';
export type ScheduleType = 'Breeding' | 'Palpation' | 'Kindling' | 'Weaning' | 'Vaccination' | 'Admin';
export type ExpenseCategory = 'Feed' | 'Medical' | 'Cages/Equipment' | 'Labor' | 'Utility' | 'Other' | 'RabbitPurchase'; // Added RabbitPurchase

// --- BASE INTERFACE ---

export interface IBaseDocument extends Document {
    // FIX: Changed from Types.ObjectId to string to match the schemas
    user_id: string;
}

// --- CUSTOM STATS INTERFACES ---

export interface IBreedingSuccessStats {
  kindling_rate_pct: number;
  total_attempts: number;
  successful_kindlings: number;
}

export interface IRabbitStats {
    total: number;
    active: number;
    kits: number;
    weaners: number;
    growers: number;
    ready_bucks: number;
    sick_or_quarantined: number;
    culled_and_deceased: number;
}

// --- CUSTOM MODEL INTERFACES (for statics) ---

// This extends the base Model to include the custom static method
export interface IBreedingModel extends Model<IBreeding> {
  getBreedingSuccess(userId: string): Promise<IBreedingSuccessStats>;
}

// This extends the base Model to include the custom static method
export interface IHealthRecordModel extends Model<IHealthRecord> {
    getSickCount(userId: string): Promise<number>;
}

// This extends the base Model to include the custom static method
export interface ISaleModel extends Model<ISale> {
    getTotalIncome(userId: string, dateRange: { start: Date; end: Date }): Promise<number>;
}

// This extends the base Model to include the custom static method
export interface IRabbitModel extends Model<IRabbit> {
    getStats(userId: string): Promise<IRabbitStats>;
}


// --- 1. IBreed (Metadata: Used for status automation) ---

export interface IBreed extends IBaseDocument {
  name: string;
  description: string | null;
  average_mature_weight_kg: number;
  maturity_age_days: number; // Days to reach 'Active' status (e.g., 150 days)
  weaning_age_days: number; // Days to reach 'Weaner' status (e.g., 30 days)
  grower_age_days: number; // Days to reach 'Grower' status (e.g., 60 days)
}

const BreedSchema = new Schema<IBreed>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: null },
  average_mature_weight_kg: { type: Number, required: true, min: 0 },
  maturity_age_days: { type: Number, required: true, min: 1, default: 150 },
  weaning_age_days: { type: Number, required: true, min: 1, default: 30 },
  grower_age_days: { type: Number, required: true, min: 1, default: 60 },
}, { timestamps: true });

// --- 2. ICage (Location: Supports A1-A12 structures) ---

export interface ICage extends IBaseDocument {
  name: string; // e.g., A1, B5, C12
  location_area: string; // e.g., Tier A, Tier B, Quarantine Section
  capacity: number;
  current_occupants: Types.ObjectId[]; // Rabbits currently in the cage
  cage_type: 'Buck' | 'Doe' | 'Grower' | 'Quarantine' | 'Nesting'; // Distribution type
}

const CageSchema = new Schema<ICage>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  name: { type: String, required: true, trim: true, unique: true },
  location_area: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1, default: 1 },
  current_occupants: [{ type: Schema.Types.ObjectId, ref: 'Rabbit', default: [] }],
  cage_type: { type: String, enum: ['Buck', 'Doe', 'Grower', 'Quarantine', 'Nesting'], required: true, index: true },
}, { timestamps: true });
CageSchema.index({ user_id: 1, cage_type: 1 });

// --- 3. IDisease (Metadata) ---

export interface IDisease extends IBaseDocument {
  name: string;
  symptoms: string[];
  treatment_protocols: string;
  is_quarantinable: boolean;
}

const DiseaseSchema = new Schema<IDisease>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  name: { type: String, required: true, trim: true, unique: true },
  symptoms: [{ type: String, trim: true }],
  treatment_protocols: { type: String },
  is_quarantinable: { type: Boolean, default: false },
}, { timestamps: true });

// --- 4. IFeedType (Metadata) ---

export interface IFeedType extends IBaseDocument {
  name: string;
  cost_per_kg: number;
}

const FeedTypeSchema = new Schema<IFeedType>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  name: { type: String, required: true, trim: true, unique: true },
  cost_per_kg: { type: Number, min: 0, required: true },
}, { timestamps: true });

// --- 5. IFeedLog (Time-Series Data: Daily Feed Consumption & Cost) ---

export interface IFeedLog extends IBaseDocument {
  feed_type_id: Types.ObjectId;
  log_date: Date;
  quantity_kg: number; // For feed efficiency and cost aggregation
  cost_usd: number; // Stored in USD base currency
  cage_id: Types.ObjectId; // Track consumption by cage/group
}

const FeedLogSchema = new Schema<IFeedLog>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  feed_type_id: { type: Schema.Types.ObjectId, ref: 'FeedType', required: true },
  log_date: { type: Date, required: true },
  quantity_kg: { type: Number, required: true, min: 0 },
  cost_usd: { type: Number, required: true, min: 0 },
  cage_id: { type: Schema.Types.ObjectId, ref: 'Cage', required: true, index: true },
}, { timestamps: true });
FeedLogSchema.index({ user_id: 1, log_date: -1, cage_id: 1 });

// --- 6. IRabbit (Core Entity) ---

export interface IRabbit extends IBaseDocument {
  ear_tag_id: string; // Suggested scalable format: D-DOEID-SEQ or B-BUCKID-SEQ
  name: string | null;
  gender: 'Male' | 'Female';
  date_of_birth: Date;
  breed_id: Types.ObjectId;
  current_cage_id: Types.ObjectId;
  status: RabbitStatus; // Auto-managed status
  source_type: RabbitSourceType; // Born | Purchased | Gifted
  source_farm: string | null; // Seller/Farm noted for Purchased/Gifted rabbits
  parent_doe_id: Types.ObjectId | null;
  parent_buck_id: Types.ObjectId | null;
  // Virtuals
  age_in_days: number;
}

const RabbitSchema = new Schema<IRabbit, IRabbitModel>({ // Cast with IRabbitModel
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
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
  source_type: { type: String, enum: ['Born', 'Purchased', 'Gifted'], required: true, default: 'Born' },
  source_farm: { type: String, default: null },
  parent_doe_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null, index: true },
  parent_buck_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null, index: true },
}, { timestamps: true, toJSON: { virtuals: true } });

// Virtual for Age calculation
RabbitSchema.virtual('age_in_days').get(function() {
  if (!this.date_of_birth) return 0;
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - this.date_of_birth.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-Save Middleware for Automatic Status Update (Growth Stages)
RabbitSchema.pre('save', async function(next) {
  // Logic from rabbit.model.ts
  const terminalOrOverrideStatuses: RabbitStatus[] = ['Sick', 'Quarantined', 'Culled', 'Deceased', 'Sold'];

  if (this.isModified('date_of_birth') || this.isNew || !terminalOrOverrideStatuses.includes(this.status as any)) {
    const ageDays = this.age_in_days;

    const breedStages = { maturity: 150, weaning: 30, grower: 60 };
    try {
      if (this.breed_id && mongoose.models.Breed) {
        const breed = await mongoose.model<IBreed>('Breed').findById(this.breed_id).select('maturity_age_days weaning_age_days grower_age_days').lean();
        if (breed) {
          breedStages.maturity = breed.maturity_age_days;
          breedStages.weaning = breed.weaning_age_days;
          breedStages.grower = breed.grower_age_days;
        }
      }
    } catch (error) {
      console.error("Error fetching breed for status update:", error);
    }

    let newStatus: RabbitStatus = 'Kit';

    if (ageDays >= breedStages.maturity) {
      newStatus = 'Active';
    } else if (ageDays >= breedStages.grower) {
      newStatus = 'Grower';
    } else if (ageDays >= breedStages.weaning) {
      newStatus = 'Weaner';
    } else {
      newStatus = 'Kit';
    }

    // Only update the status if the current status is a growth stage or if it's new
    if (['Kit', 'Weaner', 'Grower', 'Active'].includes(this.status) || this.isNew) {
        this.status = newStatus;
    }
  }

  next();
});

// --- STATIC METHOD: Get General Farm Stats ---
RabbitSchema.statics.getStats = async function(userId: string): Promise<IRabbitStats> { // New static method
    // 1. Get total count and status counts via aggregation
    const statusCounts = await this.aggregate([
        { $match: { user_id: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {
        'Kit': 0, 'Weaner': 0, 'Grower': 0, 'Active': 0, 'Sick': 0,
        'Quarantined': 0, 'Culled': 0, 'Deceased': 0, 'Sold': 0
    });

    // 2. Count active male rabbits (Ready Bucks)
    const readyBucks = await this.countDocuments({
        user_id: userId,
        gender: 'Male',
        status: 'Active'
    });

    return {
        total: counts.Kit + counts.Weaner + counts.Grower + counts.Active + counts.Sick + counts.Quarantined + counts.Culled + counts.Deceased + counts.Sold,
        active: counts.Active,
        kits: counts.Kit,
        weaners: counts.Weaner,
        growers: counts.Grower,
        ready_bucks: readyBucks,
        sick_or_quarantined: counts.Sick + counts.Quarantined,
        culled_and_deceased: counts.Culled + counts.Deceased,
    };
};

RabbitSchema.index({ user_id: 1, status: 1 });
RabbitSchema.index({ user_id: 1, ear_tag_id: 1 });

// --- 7. IWeight (Time-Series Data: Historical Growth) ---

export interface IWeight extends IBaseDocument {
  rabbit_id: Types.ObjectId;
  measurement_date: Date;
  weight_kg: number; // Dense data point for growth rate calculation
  age_at_measurement_days: number; // Indexed for growth curve queries
}

const WeightSchema = new Schema<IWeight>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String (Correcting inconsistency from snippet)
  rabbit_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true, index: true },
  measurement_date: { type: Date, required: true },
  weight_kg: { type: Number, required: true, min: 0 },
  age_at_measurement_days: { type: Number, required: true, min: 0 },
}, { timestamps: true });
WeightSchema.index({ rabbit_id: 1, measurement_date: -1 });

// --- 8. IHealthRecord (Status Updates: Sick/Quarantined) ---

export interface IHealthRecord extends IBaseDocument {
  rabbit_id: Types.ObjectId;
  disease_id: Types.ObjectId;
  date_of_diagnosis: Date;
  treatment_start_date: Date;
  treatment_end_date: Date | null;
  quarantined: boolean;
  notes: string | null;
}

const HealthRecordSchema = new Schema<IHealthRecord, IHealthRecordModel>({ // Cast with IHealthRecordModel
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
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
 */
HealthRecordSchema.statics.getSickCount = async function(userId: string): Promise<number> {
    const uniqueSickRabbits = await this.aggregate([
        // 1. Filter by user and where the treatment has not ended (treatment_end_date is null)
        { $match: { user_id: userId, treatment_end_date: null } },
        // 2. Group by rabbit_id to get only unique sick rabbits
        { $group: { _id: '$rabbit_id' } },
        // 3. Count the number of unique rabbits
        { $count: 'sickCount' }
    ]);

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
    }
  }
});

// --- 9. ILitterWeightLog (Sub-document for Litter Weight Monitoring up to weaning) ---

export interface ILitterWeightLog extends Types.Subdocument {
  measurement_date: Date;
  total_litter_weight_kg: number; // Total weight of the litter
}

const LitterWeightLogSchema = new Schema<ILitterWeightLog>({
  measurement_date: { type: Date, required: true },
  total_litter_weight_kg: { type: Number, required: true, min: 0 },
}, { _id: false });

// --- 10. ILitter (Offspring/Kits) ---

export interface ILitter extends IBaseDocument {
  breeding_id: Types.ObjectId;
  kindling_date: Date;
  doe_id: Types.ObjectId;
  buck_id: Types.ObjectId;
  total_kits_born: number;
  kits_surviving: number;
  weaning_date: Date | null;
  litter_weight_logs: Types.DocumentArray<ILitterWeightLog>; // Monitoring up to weaning stage
}

const LitterSchema = new Schema<ILitter>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  breeding_id: { type: Schema.Types.ObjectId, ref: 'Breeding', required: true, index: true },
  kindling_date: { type: Date, required: true },
  doe_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
  buck_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
  total_kits_born: { type: Number, required: true, min: 0 },
  kits_surviving: { type: Number, required: true, min: 0 },
  weaning_date: { type: Date, default: null },
  litter_weight_logs: { type: [LitterWeightLogSchema], default: [] }, // Array of sub-documents
}, { timestamps: true });
LitterSchema.index({ user_id: 1, kindling_date: -1 });

// --- 11. IBreeding (Mating Event) ---

export interface IBreeding extends IBaseDocument {
  doe_id: Types.ObjectId;
  buck_id: Types.ObjectId;
  mating_date: Date;
  expected_kindling_date: Date; // Automation: Mating date + ~31 days
  is_successful: boolean;
  litter_id: Types.ObjectId | null;
}

const BreedingSchema = new Schema<IBreeding, IBreedingModel>({ // Cast with IBreedingModel
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  doe_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true, index: true },
  buck_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', required: true },
  mating_date: { type: Date, required: true },
  expected_kindling_date: { type: Date, required: true },
  is_successful: { type: Boolean, default: false },
  litter_id: { type: Schema.Types.ObjectId, ref: 'Litter', default: null, index: true },
}, { timestamps: true });

BreedingSchema.pre('validate', function(next) {
  if (this.mating_date && !this.expected_kindling_date) {
    const expected = new Date(this.mating_date);
    expected.setDate(expected.getDate() + 31); // Average gestation is 31 days
    this.expected_kindling_date = expected;
  }
  next();
});

// --- STATIC METHOD: Calculate Breeding Success Rate ---
BreedingSchema.statics.getBreedingSuccess = async function(
  userId: string
): Promise<IBreedingSuccessStats> {
    const totalBreedingAttempts = await this.countDocuments({ user_id: userId });
    const successfulKindlings = await this.countDocuments({ user_id: userId, is_successful: true });

    let kindlingRatePct = 0;
    if (totalBreedingAttempts > 0) {
        kindlingRatePct = (successfulKindlings / totalBreedingAttempts) * 100;
    }

    return {
        kindling_rate_pct: kindlingRatePct,
        total_attempts: totalBreedingAttempts,
        successful_kindlings: successfulKindlings
    };
};

// --- 12. ISchedule (Future Tasks/Automation - Future Breeding Schedules) ---

export interface ISchedule extends IBaseDocument {
  target_date: Date; // Future date for the task/alert
  type: ScheduleType;
  description: string;
  is_completed: boolean;
  related_rabbit_ids: Types.ObjectId[]; // e.g., buck 'x' to mate doe 'y' on date 12345
  related_entity_id: Types.ObjectId | null; // e.g., link to a specific Breeding record once it occurs
}

const ScheduleSchema = new Schema<ISchedule>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  target_date: { type: Date, required: true, index: true },
  type: { type: String, enum: ['Breeding', 'Palpation', 'Kindling', 'Weaning', 'Vaccination', 'Admin'], required: true, index: true },
  description: { type: String, required: true },
  is_completed: { type: Boolean, default: false, index: true },
  related_rabbit_ids: [{ type: Schema.Types.ObjectId, ref: 'Rabbit', default: [] }],
  related_entity_id: { type: Schema.Types.ObjectId, default: null },
}, { timestamps: true });
ScheduleSchema.index({ user_id: 1, target_date: 1, is_completed: 1 });

// --- 13. ISale (Financial Transaction - P&L: Includes By-products) ---

export interface ISale extends IBaseDocument {
  transaction_date: Date;
  amount_usd: number; // Base currency for financial integrity
  item_type: SaleItemType;
  rabbit_id: Types.ObjectId | null;
  byproduct_type: ByProductType | null; // Manure, Urine, Pelts, etc.
  quantity_sold: number;
  notes: string | null;
}

const SaleSchema = new Schema<ISale, ISaleModel>({ // Cast with ISaleModel
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  transaction_date: { type: Date, required: true, index: true },
  amount_usd: { type: Number, required: true, min: 0 },
  item_type: { type: String, enum: ['Rabbit', 'ByProduct', 'Other'], required: true, index: true },
  rabbit_id: { type: Schema.Types.ObjectId, ref: 'Rabbit', default: null, index: true },
  byproduct_type: { type: String, enum: ['Manure', 'Urine', 'Pelts', 'Other', null], default: null },
  quantity_sold: { type: Number, required: true, min: 0 },
  notes: { type: String, default: null },
}, { timestamps: true });

SaleSchema.index({ user_id: 1, transaction_date: -1 });

// --- STATIC METHOD: Get Total Income for a Date Range ---
SaleSchema.statics.getTotalIncome = async function(
    userId: string,
    dateRange: { start: Date; end: Date }
): Promise<number> {

    const result = await this.aggregate([
        {
            $match: {
                user_id: userId,
                transaction_date: {
                    $gte: dateRange.start,
                    $lte: dateRange.end,
                },
            },
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$amount_usd' },
            },
        },
    ]);

    return result.length > 0 ? result[0].totalRevenue : 0;
};

// --- 14. IExpense (Financial Transaction - P&L) ---

export interface IExpense extends IBaseDocument {
  transaction_date: Date;
  amount_usd: number; // Base currency for financial integrity
  category: ExpenseCategory;
  description: string;
  notes: string | null;
}

const ExpenseSchema = new Schema<IExpense>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
  transaction_date: { type: Date, required: true, index: true },
  amount_usd: { type: Number, required: true, min: 0 },
  category: { type: String, enum: ['Feed', 'Medical', 'Cages/Equipment', 'Labor', 'Utility', 'Other', 'RabbitPurchase'], required: true, index: true },
  description: { type: String, required: true },
  notes: { type: String, default: null },
}, { timestamps: true });
ExpenseSchema.index({ user_id: 1, transaction_date: -1 });

// --- 15. ICull / IDeath (Terminal Statuses) ---

export interface ICull extends IBaseDocument {
  rabbit_id: Types.ObjectId;
  date_culled: Date;
  reason: 'Meat' | 'Health' | 'Poor Performance' | 'Other';
}

const CullSchema = new Schema<ICull>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
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


export interface IDeath extends IBaseDocument {
  rabbit_id: Types.ObjectId;
  date_of_death: Date;
  cause_of_death: string;
}

const DeathSchema = new Schema<IDeath>({
  user_id: { type: String, required: true, index: true }, // FIXED: Changed to String
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


// --- Model Initialization/Export (Next.js safe) ---

export const Breed = (mongoose.models.Breed || mongoose.model<IBreed>('Breed', BreedSchema)) as Model<IBreed>;
export const Cage = (mongoose.models.Cage || mongoose.model<ICage>('Cage', CageSchema)) as Model<ICage>;
export const Disease = (mongoose.models.Disease || mongoose.model<IDisease>('Disease', DiseaseSchema)) as Model<IDisease>;
export const FeedType = (mongoose.models.FeedType || mongoose.model<IFeedType>('FeedType', FeedTypeSchema)) as Model<IFeedType>;
export const FeedLog = (mongoose.models.FeedLog || mongoose.model<IFeedLog>('FeedLog', FeedLogSchema)) as Model<IFeedLog>;
// Exporting Rabbit with the custom model interface
export const Rabbit = (mongoose.models.Rabbit || mongoose.model<IRabbit, IRabbitModel>('Rabbit', RabbitSchema)) as IRabbitModel;
export const Weight = (mongoose.models.Weight || mongoose.model<IWeight>('Weight', WeightSchema)) as Model<IWeight>;
// Exporting HealthRecord with the custom model interface
export const HealthRecord = (mongoose.models.HealthRecord || mongoose.model<IHealthRecord, IHealthRecordModel>('HealthRecord', HealthRecordSchema)) as IHealthRecordModel;
export const Litter = (mongoose.models.Litter || mongoose.model<ILitter>('Litter', LitterSchema)) as Model<ILitter>;
// Exporting Breeding with the custom model interface
export const Breeding = (mongoose.models.Breeding || mongoose.model<IBreeding, IBreedingModel>('Breeding', BreedingSchema)) as IBreedingModel;
export const Schedule = (mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema)) as Model<ISchedule>;
// Exporting Sale with the custom model interface
export const Sale = (mongoose.models.Sale || mongoose.model<ISale, ISaleModel>('Sale', SaleSchema)) as ISaleModel;
export const Expense = (mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema)) as Model<IExpense>;
export const Cull = (mongoose.models.Cull || mongoose.model<ICull>('Cull', CullSchema)) as Model<ICull>;
export const Death = (mongoose.models.Death || mongoose.model<IDeath>('Death', DeathSchema)) as Model<IDeath>;


/**
 * Helper function for Next.js environments to ensure all models are explicitly loaded/compiled.
 * This should be called in your `mongodb.ts` connection function.
 */
export function initModels() {
  if (mongoose.models.Rabbit === undefined) {
    // Accessing the constants above ensures they are initialized
    console.log('--- Explicitly Initializing All Farm Models ---');
    [Breed, Cage, Disease, FeedType, FeedLog, Rabbit, Weight, HealthRecord, Litter, Breeding, Schedule, Sale, Expense, Cull, Death];
  }
}