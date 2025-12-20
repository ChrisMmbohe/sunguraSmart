import { Document, Types, Model } from 'mongoose';

// --- GLOBAL UTILITY TYPES AND ENUMS ---

/** Status changes: Kit -> Weaner -> Grower -> Active (age-based) | Sick/Quarantined (health-based) | Culled/Deceased/Sold (terminal) */
export type RabbitStatus = 'Kit' | 'Weaner' | 'Grower' | 'Active' | 'Sick' | 'Quarantined' | 'Culled' | 'Deceased' | 'Sold';
export type RabbitSourceType = 'Born' | 'Purchased' | 'Gifted';
export type SaleItemType = 'Rabbit' | 'ByProduct' | 'Other';
export type ByProductType = 'Manure' | 'Urine' | 'Pelts' | 'Other';
export type ScheduleType = 'Breeding' | 'Palpation' | 'Kindling' | 'Weaning' | 'Vaccination' | 'Admin';
export type ExpenseCategory = 'Feed' | 'Medical' | 'Cages/Equipment' | 'Labor' | 'Utility' | 'Other' | 'RabbitPurchase';

// --- INTERFACES ---

export interface IBaseDocument extends Document {
    // FIX: Changed from Types.ObjectId to string to match the schemas
    user_id: string; 
}

// --- BREED (Metadata: Used for status automation) ---

export interface IBreed extends IBaseDocument {
    name: string; // e.g., A1, B5, C12
    description: string | null;
    average_mature_weight_kg: number;
    maturity_age_days: number; // Days to reach 'Active' status (e.g., 150 days)
    weaning_age_days: number; // Days to reach 'Weaner' status (e.g., 30 days)
    grower_age_days: number; // Days to reach 'Grower' status (e.g., 60 days)
}

// --- CAGE (Location: Supports A1-A12 structures) ---

export interface ICage extends IBaseDocument {
    name: string; // e.g., A1, B5, C12
    location_area: string; // e.g., Tier A, Tier B, Quarantine Section
    capacity: number;
    current_occupants: Types.ObjectId[]; // Rabbits currently in the cage
    cage_type: 'Buck' | 'Doe' | 'Grower' | 'Quarantine' | 'Nesting'; // Distribution type
}

// --- DISEASE (Metadata) ---

export interface IDisease extends IBaseDocument {
    name: string;
    symptoms: string[];
    treatment_protocols: string;
    is_quarantinable: boolean;
}

// --- FEED TYPE (Metadata) ---

export interface IFeedType extends IBaseDocument {
    name: string;
    cost_per_kg: number;
}

// --- FEED LOG (Time-Series Data) ---

export interface IFeedLog extends IBaseDocument {
    feed_type_id: Types.ObjectId;
    log_date: Date;
    quantity_kg: number;
    cost_usd: number;
    cage_id: Types.ObjectId;
}

// --- LITTER WEIGHT LOG (Sub-document) ---

export interface ILitterWeightLog extends Types.Subdocument {
    measurement_date: Date;
    total_litter_weight_kg: number;
}

// --- LITTER (Offspring/Kits) ---

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

// --- BREEDING (Mating Event) ---

export interface IBreeding extends IBaseDocument {
    doe_id: Types.ObjectId;
    buck_id: Types.ObjectId;
    mating_date: Date;
    expected_kindling_date: Date;
    is_successful: boolean;
    litter_id: Types.ObjectId | null;
}

// --- STATS RETURN TYPE FOR BREEDING MODEL ---
export interface IBreedingSuccessStats {
    kindling_rate_pct: number;
    total_attempts: number;
    successful_kindlings: number;
}

// --- BREEDING MODEL INTERFACE (with Statics) ---
// This extends the base Model to include the custom static method
export interface IBreedingModel extends Model<IBreeding> {
    getBreedingSuccess(userId: string | Types.ObjectId): Promise<IBreedingSuccessStats>;
}


// --- SCHEDULE (Future Tasks/Automation) ---

export interface ISchedule extends IBaseDocument {
    target_date: Date;
    type: ScheduleType;
    description: string;
    is_completed: boolean;
    related_rabbit_ids: Types.ObjectId[]; // e.g., buck 'x' to mate doe 'y' on date 12345
    related_entity_id: Types.ObjectId | null;
}

// --- SALE (Financial Transaction - P&L: Includes By-products) ---

export interface ISale extends IBaseDocument {
    transaction_date: Date;
    amount_usd: number;
    item_type: SaleItemType;
    rabbit_id: Types.ObjectId | null;
    byproduct_type: ByProductType | null;
    quantity_sold: number;
    notes: string | null;
}

// --- SALE MODEL INTERFACE (with Statics) ---
// This extends the base Model to include the custom static method
export interface ISaleModel extends Model<ISale> {
    getTotalIncome(
        userId: string,
        dateRange: { start: Date; end: Date }
    ): Promise<number>;
}

// --- EXPENSE (Financial Transaction - P&L) ---

export interface IExpense extends IBaseDocument {
    transaction_date: Date;
    amount_usd: number;
    category: ExpenseCategory;
    description: string;
    notes: string | null;
}

// --- CULL (Terminal Status) ---

export interface ICull extends IBaseDocument {
    rabbit_id: Types.ObjectId;
    date_culled: Date;
    reason: 'Meat' | 'Health' | 'Poor Performance' | 'Other';
}

// --- DEATH (Terminal Status) ---

export interface IDeath extends IBaseDocument {
    rabbit_id: Types.ObjectId;
    date_of_death: Date;
    cause_of_death: string;
}

// --- WEIGHT (Time-Series Data: Historical Growth) ---

export interface IWeight extends IBaseDocument {
    rabbit_id: Types.ObjectId;
    measurement_date: Date;
    weight_kg: number;
    age_at_measurement_days: number;
}

// --- HEALTH RECORD (Status Updates: Sick/Quarantined) ---

export interface IHealthRecord extends IBaseDocument {
    rabbit_id: Types.ObjectId;
    disease_id: Types.ObjectId;
    date_of_diagnosis: Date;
    treatment_start_date: Date;
    treatment_end_date: Date | null;
    quarantined: boolean;
    notes: string | null;
}

// --- HEALTH RECORD MODEL INTERFACE (with Statics) ---
// This extends the base Model to include the custom static method
export interface IHealthRecordModel extends Model<IHealthRecord> {
    // New static method to get the count of rabbits currently sick/quarantined
    getSickCount(userId: string): Promise<number>;
}

// --- RABBIT (Core Entity) ---

export interface IRabbit extends IBaseDocument {
    ear_tag_id: string;
    name: string | null;
    gender: 'Male' | 'Female';
    date_of_birth: Date;
    breed_id: Types.ObjectId;
    current_cage_id: Types.ObjectId;
    status: RabbitStatus;
    source_type: RabbitSourceType;
    source_farm: string | null;
    parent_doe_id: Types.ObjectId | null;
    parent_buck_id: Types.ObjectId | null;
    // Virtuals
    age_in_days: number;
    full_name: string; // FIX: Added missing virtual
    maturity_status: string; // FIX: Added missing virtual
    is_pregnant: boolean; // FIX: Added missing virtual
}

// --- RABBIT STATS RETURN TYPE ---
export interface IRabbitStats {
    total: number;
    active: number;
    bucks: number;
    does: number;
}

// --- RABBIT MODEL INTERFACE (with Statics) ---
// This extends the base Model to include the custom static method
export interface IRabbitModel extends Model<IRabbit> {
    getStats(userId: string): Promise<IRabbitStats>;
}