import { z } from "zod"
import { Gender, RabbitStatus, HealthStatus, AcquisitionType, RabbitPurpose } from "@/types/enums"

/**
 * Flattened, table/form-friendly view of a Rabbit document. Populated
 * refs (breed, cage, sire, dam) are resolved to display strings server
 * side so the client never has to know about ObjectIds for rendering.
 */
export interface RabbitTableData {
  id: string
  tagNumber: string
  name?: string
  breedId: string
  breedName: string
  gender: Gender
  dateOfBirth?: string // ISO date
  ageDays?: number
  status: RabbitStatus
  healthStatus: HealthStatus
  sireId?: string
  sireName?: string
  damId?: string
  damName?: string
  acquisitionType: AcquisitionType
  acquisitionDate: string // ISO date
  sourceFarm?: string
  acquisitionCost?: number
  purpose: RabbitPurpose
  cageId?: string
  cageLabel?: string
  currentWeightKg?: number
  lastWeighedAt?: string
  color?: string
  markings?: string
  notes?: string
}

/** Lightweight option shape used to populate breed / cage / parent selects in the form. */
export interface SelectOption {
  value: string
  label: string
}

export interface RabbitFormOptions {
  breeds: SelectOption[]
  cages: SelectOption[]
  bucks: SelectOption[] // active males, for sire select
  does: SelectOption[] // active females, for dam select
}

// ---------------------------------------------------------------------------
// Validation — shared between the client form and the server actions so
// both sides reject the same bad input.
// ---------------------------------------------------------------------------

export const rabbitFormSchema = z.object({
  tagNumber: z.string().trim().min(1, "Tag number is required").max(40),
  name: z.string().trim().max(60).optional().or(z.literal("")),
  breed: z.string().min(1, "Select a breed"),
  gender: z.nativeEnum(Gender),
  dateOfBirth: z.string().optional().or(z.literal("")),
  status: z.nativeEnum(RabbitStatus),
  healthStatus: z.nativeEnum(HealthStatus),
  acquisitionType: z.nativeEnum(AcquisitionType),
  acquisitionDate: z.string().min(1, "Acquisition date is required"),
  sourceFarm: z.string().trim().max(120).optional().or(z.literal("")),
  acquisitionCost: z.coerce.number().min(0).optional(),
  purpose: z.nativeEnum(RabbitPurpose),
  cage: z.string().optional().or(z.literal("")),
  sire: z.string().optional().or(z.literal("")),
  dam: z.string().optional().or(z.literal("")),
  color: z.string().trim().max(60).optional().or(z.literal("")),
  markings: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
})

export type RabbitFormValues = z.infer<typeof rabbitFormSchema>

export const weightLogFormSchema = z.object({
  weightKg: z.coerce.number().min(0.01, "Enter a weight greater than 0"),
  recordedAt: z.string().min(1, "Date is required"),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
})

export type WeightLogFormValues = z.infer<typeof weightLogFormSchema>

// ---------------------------------------------------------------------------
// Per-rabbit analytics — fetched on demand when the "View analytics" row
// action is used, rather than upfront for every row in the table.
// ---------------------------------------------------------------------------

export interface WeightHistoryPoint {
  date: string // ISO date
  weightKg: number
}

export interface RabbitAnalytics {
  weightHistory: WeightHistoryPoint[]
  latestWeightKg?: number
  weightTrend: { deltaKg: number; deltaPct: number } | null // vs the reading before it
  ageDays?: number
  daysOnFarm: number
  litterCount: number // litters where this rabbit is the doe or the buck
  totalOffspring: number // kits born alive across those litters
  avgLitterSize: number | null // only meaningful for does with at least one litter
  healthRecordCount: number
  lastHealthEvent: { type: string; date: string; outcome: string } | null
}
