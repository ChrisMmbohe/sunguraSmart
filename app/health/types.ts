import { z } from "zod"
import { HealthRecordType, HealthRecordOutcome, DiseaseSeverity } from "@/types/enums"

/**
 * Buckets a health record's follow-up into a single searchable/filterable
 * label, mirroring the Schedule page's urgency concept but scoped to
 * whether the case is still open (ongoing/chronic) and whether its
 * follow-up date has passed.
 */
export type FollowUpUrgency =
  | "Overdue"
  | "Due today"
  | "Due this week"
  | "Upcoming"
  | "No follow-up"
  | "Resolved"

export interface SelectOption {
  value: string
  label: string
}

// ---------------------------------------------------------------------------
// Health records
// ---------------------------------------------------------------------------

/**
 * Flattened, table/calendar/form-friendly view of a HealthRecord document.
 * Populated refs (rabbit, disease) are resolved to display strings server
 * side, mirroring the Rabbit/Litter/Schedule table-data pattern.
 */
export interface HealthRecordTableData {
  id: string
  rabbitId: string
  rabbitLabel: string
  type: HealthRecordType
  diseaseId?: string
  diseaseName?: string
  diseaseContagious?: boolean
  date: string // ISO
  treatment?: string
  medication?: string
  dosage?: string
  cost?: number
  outcome: HealthRecordOutcome
  followUpDate?: string // ISO
  followUpUrgency: FollowUpUrgency
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface HealthRecordFormOptions {
  rabbits: SelectOption[] // active rabbits
  diseases: DiseaseOption[]
}

export const healthRecordFormSchema = z
  .object({
    rabbit: z.string().min(1, "Select a rabbit"),
    type: z.nativeEnum(HealthRecordType),
    disease: z.string().optional().or(z.literal("")),
    date: z.string().min(1, "Date is required"),
    treatment: z.string().trim().max(300).optional().or(z.literal("")),
    medication: z.string().trim().max(120).optional().or(z.literal("")),
    dosage: z.string().trim().max(60).optional().or(z.literal("")),
    cost: z.coerce.number().min(0).optional(),
    outcome: z.nativeEnum(HealthRecordOutcome),
    followUpDate: z.string().optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.followUpDate && data.date && data.followUpDate < data.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Follow-up date can't be before the record date",
        path: ["followUpDate"],
      })
    }
  })

export type HealthRecordFormValues = z.infer<typeof healthRecordFormSchema>

// ---------------------------------------------------------------------------
// Disease catalog
// ---------------------------------------------------------------------------

export interface DiseaseOption extends SelectOption {
  isContagious: boolean
  defaultSeverity: DiseaseSeverity
}

export interface DiseaseTableData {
  id: string
  name: string
  symptoms: string[]
  defaultSeverity: DiseaseSeverity
  isContagious: boolean
  recommendedTreatment?: string
  preventionNotes?: string
  recordCount: number // how many health records reference this disease, for delete-safety
}

export const diseaseFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  symptoms: z.string().trim().max(400).optional().or(z.literal("")), // comma-separated in the form, split on submit
  defaultSeverity: z.nativeEnum(DiseaseSeverity),
  isContagious: z.boolean(),
  recommendedTreatment: z.string().trim().max(300).optional().or(z.literal("")),
  preventionNotes: z.string().trim().max(300).optional().or(z.literal("")),
})

export type DiseaseFormValues = z.infer<typeof diseaseFormSchema>

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface HealthTypeBreakdown {
  type: HealthRecordType
  count: number
}

export interface HealthOutcomeBreakdown {
  outcome: HealthRecordOutcome
  count: number
}

export interface TopDisease {
  diseaseId: string
  name: string
  isContagious: boolean
  count: number
}

export interface HealthAnalyticsSummary {
  currentlySick: number // Rabbit.healthStatus === SICK, active rabbits
  currentlyRecovering: number
  currentlyQuarantined: number
  recordsThisMonth: number
  overdueFollowUps: number
  dueThisWeekFollowUps: number
  costThisMonth: number
  outcomeBreakdown: HealthOutcomeBreakdown[] // trailing 12 months
  byType: HealthTypeBreakdown[] // trailing 12 months
  topDiseases: TopDisease[] // all-time, top 5
}
