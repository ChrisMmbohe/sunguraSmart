/**
 * Shared enums for the sunguraSmart data layer.
 * Kept in one place so UI, API validation (zod/yup) and Mongoose schemas
 * all reference the exact same string unions.
 */

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

/** Lifecycle status of a rabbit on the farm. */
export enum RabbitStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  DECEASED = 'deceased',
  RETIRED = 'retired',
  TRANSFERRED = 'transferred',
}

/** Current health condition, kept separate from lifecycle status so a
 *  sick rabbit is still "active" but flagged for attention. Synced from
 *  HealthRecord entries via post-save hook. */
export enum HealthStatus {
  HEALTHY = 'healthy',
  SICK = 'sick',
  RECOVERING = 'recovering',
  QUARANTINED = 'quarantined',
  DECEASED = 'deceased',
}

export enum AcquisitionType {
  BORN_ON_FARM = 'born_on_farm',
  PURCHASED = 'purchased',
  GIFT = 'gift',
  TRANSFER_IN = 'transfer_in',
  OTHER = 'other',
}

export enum RabbitPurpose {
  BREEDING_STOCK = 'breeding_stock',
  MEAT = 'meat',
  FUR = 'fur',
  PET = 'pet',
  SHOW = 'show',
}

export enum CageStatus {
  OCCUPIED = 'occupied',
  EMPTY = 'empty',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export enum CageType {
  BREEDING = 'breeding',
  GROW_OUT = 'grow_out',
  MATERNITY = 'maternity',
  QUARANTINE = 'quarantine',
  BUCK = 'buck',
}

export enum BreedingStatus {
  PLANNED = 'planned',
  PAIRED = 'paired',
  CONFIRMED_PREGNANT = 'confirmed_pregnant',
  FAILED = 'failed',
  KINDLED = 'kindled',
  WEANED = 'weaned',
  ABORTED = 'aborted',
}

export enum BreedingMethod {
  NATURAL = 'natural',
  ARTIFICIAL_INSEMINATION = 'artificial_insemination',
}

export enum FeedCategory {
  PELLETS = 'pellets',
  HAY = 'hay',
  GREENS = 'greens',
  CONCENTRATE = 'concentrate',
  SUPPLEMENT = 'supplement',
  OTHER = 'other',
}

export enum FeedUnit {
  KG = 'kg',
  G = 'g',
  BALE = 'bale',
  LITER = 'liter',
  UNIT = 'unit',
}

export enum DiseaseSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

export enum HealthRecordType {
  ILLNESS = 'illness',
  INJURY = 'injury',
  VACCINATION = 'vaccination',
  DEWORMING = 'deworming',
  ROUTINE_CHECKUP = 'routine_checkup',
  TREATMENT = 'treatment',
  OTHER = 'other',
}

export enum HealthRecordOutcome {
  ONGOING = 'ongoing',
  RECOVERED = 'recovered',
  DECEASED = 'deceased',
  CHRONIC = 'chronic',
}

export enum ScheduleType {
  VACCINATION = 'vaccination',
  DEWORMING = 'deworming',
  HEALTH_CHECK = 'health_check',
  BREEDING_FOLLOWUP = 'breeding_followup',
  WEANING = 'weaning',
  FEEDING_RESTOCK = 'feeding_restock',
  OTHER = 'other',
}

export enum RecurrenceFrequency {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  CUSTOM_DAYS = 'custom_days',
}

export enum ScheduleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}

export enum SaleItemType {
  LIVE_RABBIT = 'live_rabbit',
  MEAT = 'meat',
  FUR = 'fur',
  MANURE = 'manure',
  OTHER = 'other',
}

export enum PaymentMethod {
  CASH = 'cash',
  MPESA = 'mpesa',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT = 'credit',
  OTHER = 'other',
}

export enum ExpenseCategory {
  FEED = 'feed',
  VETERINARY = 'veterinary',
  UPKEEP = 'upkeep',
  EQUIPMENT = 'equipment',
  LABOR = 'labor',
  UTILITIES = 'utilities',
  BREEDING_STOCK = 'breeding_stock',
  OTHER = 'other',
}
