import { z } from "zod"
import { ScheduleType, ScheduleStatus, RecurrenceFrequency } from "@/types/enums"

/**
 * Buckets a schedule item into a single, searchable/filterable label that
 * folds "pending + overdue" into its own bucket instead of making the
 * user cross-reference status against dueDate mentally. Drives both the
 * urgency badge in the table and the "Urgency" facet.
 */
export type ScheduleUrgency =
  | "Overdue"
  | "Due today"
  | "Due this week"
  | "Upcoming"
  | "Completed"
  | "Missed"
  | "Cancelled"

/**
 * Flattened, table/calendar/form-friendly view of a Schedule document.
 * The populated `rabbit` ref is resolved to a display label server side,
 * mirroring the Rabbit/Litter table-data pattern.
 */
export interface ScheduleTableData {
  id: string
  title: string
  type: ScheduleType
  rabbitId?: string
  rabbitLabel?: string // undefined => farm-wide task
  dueDate: string // ISO datetime
  status: ScheduleStatus
  recurrenceFrequency: RecurrenceFrequency
  recurrenceCustomDays?: number
  recurrenceLabel: string // e.g. "Every 14 days", "Monthly", "One-time"
  completedDate?: string // ISO datetime
  relatedHealthRecordId?: string
  notes?: string
  isOverdue: boolean
  urgency: ScheduleUrgency
  createdAt: string
  updatedAt: string
}

export interface SelectOption {
  value: string
  label: string
}

export interface ScheduleFormOptions {
  rabbits: SelectOption[] // active rabbits, for the optional rabbit-specific link
}

// ---------------------------------------------------------------------------
// Validation — shared between the client form and the server actions.
// ---------------------------------------------------------------------------

export const scheduleFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    type: z.nativeEnum(ScheduleType),
    rabbit: z.string().optional().or(z.literal("")), // "" => farm-wide
    dueDate: z.string().min(1, "Due date is required"),
    status: z.nativeEnum(ScheduleStatus).optional(), // only surfaced when editing
    recurrenceFrequency: z.nativeEnum(RecurrenceFrequency),
    recurrenceCustomDays: z.coerce.number().int().min(1).optional(),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.recurrenceFrequency === RecurrenceFrequency.CUSTOM_DAYS && !data.recurrenceCustomDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter the number of days between occurrences",
        path: ["recurrenceCustomDays"],
      })
    }
  })

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

// ---------------------------------------------------------------------------
// Analytics — fetched once alongside the table data to power the summary
// tiles and the type-breakdown chart above the table/calendar.
// ---------------------------------------------------------------------------

export interface ScheduleTypeBreakdown {
  type: ScheduleType
  pending: number
  completed: number
  missed: number
  cancelled: number
}

export interface ScheduleAnalyticsSummary {
  totalPending: number
  overdueCount: number
  dueTodayCount: number
  dueThisWeekCount: number
  completedThisMonthCount: number
  /** completed / (completed + missed) over the trailing 90 days, as a percentage */
  completionRatePct: number
  byType: ScheduleTypeBreakdown[]
}
