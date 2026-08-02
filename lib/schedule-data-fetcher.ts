import "server-only"

import { auth } from "@clerk/nextjs/server"
import { dbConnect, Schedule, Rabbit, RabbitStatus, ScheduleStatus, RecurrenceFrequency } from "@/database"
import type {
  ScheduleTableData,
  ScheduleFormOptions,
  ScheduleAnalyticsSummary,
  ScheduleTypeBreakdown,
  ScheduleUrgency,
} from "@/app/schedule/types"
import { ScheduleType } from "@/types/enums"

function requireUserId(userId: string | null): asserts userId is string {
  if (!userId) {
    throw new Error("Not authenticated.")
  }
}

function recurrenceLabel(frequency: RecurrenceFrequency, customDays?: number): string {
  switch (frequency) {
    case RecurrenceFrequency.NONE:
      return "One-time"
    case RecurrenceFrequency.DAILY:
      return "Daily"
    case RecurrenceFrequency.WEEKLY:
      return "Weekly"
    case RecurrenceFrequency.BIWEEKLY:
      return "Every 2 weeks"
    case RecurrenceFrequency.MONTHLY:
      return "Monthly"
    case RecurrenceFrequency.CUSTOM_DAYS:
      return customDays ? `Every ${customDays} day${customDays === 1 ? "" : "s"}` : "Custom"
    default:
      return "One-time"
  }
}

function computeUrgency(status: ScheduleStatus, dueDate: Date, now: Date): ScheduleUrgency {
  if (status === ScheduleStatus.COMPLETED) return "Completed"
  if (status === ScheduleStatus.MISSED) return "Missed"
  if (status === ScheduleStatus.CANCELLED) return "Cancelled"

  const diffDays = (dueDate.getTime() - now.getTime()) / 86_400_000
  if (diffDays < 0) return "Overdue"
  if (diffDays < 1) return "Due today"
  if (diffDays <= 7) return "Due this week"
  return "Upcoming"
}

/**
 * Fetches every schedule item belonging to the current tenant, populated
 * with a rabbit display label, and shaped for the data table, calendar,
 * and search — all three views share this single fetch.
 */
export async function getScheduleForTable(): Promise<ScheduleTableData[]> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const items = await Schedule.find({ userId })
    .populate({ path: "rabbit", select: "name tagNumber" })
    .sort({ dueDate: 1 })
    .lean<any[]>()

  const now = new Date()

  return items.map((s) => {
    const dueDate = new Date(s.dueDate)
    const status: ScheduleStatus = s.status
    const isOverdue = status === ScheduleStatus.PENDING && dueDate.getTime() < now.getTime()

    return {
      id: String(s._id),
      title: s.title,
      type: s.type,
      rabbitId: s.rabbit ? String(s.rabbit._id ?? s.rabbit) : undefined,
      rabbitLabel: s.rabbit ? s.rabbit.name || s.rabbit.tagNumber : undefined,
      dueDate: dueDate.toISOString(),
      status,
      recurrenceFrequency: s.recurrence?.frequency ?? RecurrenceFrequency.NONE,
      recurrenceCustomDays: s.recurrence?.customDays,
      recurrenceLabel: recurrenceLabel(s.recurrence?.frequency ?? RecurrenceFrequency.NONE, s.recurrence?.customDays),
      completedDate: s.completedDate ? new Date(s.completedDate).toISOString() : undefined,
      relatedHealthRecordId: s.relatedHealthRecord ? String(s.relatedHealthRecord) : undefined,
      notes: s.notes,
      isOverdue,
      urgency: computeUrgency(status, dueDate, now),
      createdAt: new Date(s.createdAt).toISOString(),
      updatedAt: new Date(s.updatedAt).toISOString(),
    }
  })
}

/** Active rabbits, for the optional "link to a specific rabbit" select in the form. */
export async function getScheduleFormOptions(): Promise<ScheduleFormOptions> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const rabbits = await Rabbit.find({ userId, status: RabbitStatus.ACTIVE })
    .select("name tagNumber")
    .sort({ tagNumber: 1 })
    .lean<any[]>()

  return {
    rabbits: rabbits.map((r) => ({
      value: String(r._id),
      label: r.name ? `${r.name} (#${r.tagNumber})` : `#${r.tagNumber}`,
    })),
  }
}

/**
 * Farm-wide schedule analytics for the summary tiles and type-breakdown
 * chart. Computed with a single $facet aggregation so the counts stay
 * accurate even when the client-side table/calendar is filtered down.
 */
export async function getScheduleAnalytics(): Promise<ScheduleAnalyticsSummary> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(endOfToday.getDate() + 1)
  const weekFromNow = new Date(now.getTime() + 7 * 86_400_000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000)

  const [result] = await Schedule.aggregate([
    { $match: { userId } },
    {
      $facet: {
        totalPending: [{ $match: { status: ScheduleStatus.PENDING } }, { $count: "count" }],
        overdue: [
          { $match: { status: ScheduleStatus.PENDING, dueDate: { $lt: now } } },
          { $count: "count" },
        ],
        dueToday: [
          { $match: { status: ScheduleStatus.PENDING, dueDate: { $gte: startOfToday, $lt: endOfToday } } },
          { $count: "count" },
        ],
        dueThisWeek: [
          { $match: { status: ScheduleStatus.PENDING, dueDate: { $gte: now, $lte: weekFromNow } } },
          { $count: "count" },
        ],
        completedThisMonth: [
          { $match: { status: ScheduleStatus.COMPLETED, completedDate: { $gte: startOfMonth } } },
          { $count: "count" },
        ],
        completionWindow: [
          {
            $match: {
              status: { $in: [ScheduleStatus.COMPLETED, ScheduleStatus.MISSED] },
              dueDate: { $gte: ninetyDaysAgo },
            },
          },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],
        byType: [
          { $group: { _id: { type: "$type", status: "$status" }, count: { $sum: 1 } } },
        ],
      },
    },
  ])

  const get = (arr: any[]) => arr?.[0]?.count ?? 0

  const completionWindow: Record<string, number> = {}
  for (const row of result.completionWindow ?? []) {
    completionWindow[row._id] = row.count
  }
  const completed = completionWindow[ScheduleStatus.COMPLETED] ?? 0
  const missed = completionWindow[ScheduleStatus.MISSED] ?? 0
  const completionRatePct = completed + missed > 0 ? Math.round((completed / (completed + missed)) * 1000) / 10 : 100

  const byTypeMap = new Map<ScheduleType, ScheduleTypeBreakdown>()
  for (const type of Object.values(ScheduleType)) {
    byTypeMap.set(type, { type, pending: 0, completed: 0, missed: 0, cancelled: 0 })
  }
  for (const row of result.byType ?? []) {
    const entry = byTypeMap.get(row._id.type)
    if (!entry) continue
    if (row._id.status === ScheduleStatus.PENDING) entry.pending += row.count
    else if (row._id.status === ScheduleStatus.COMPLETED) entry.completed += row.count
    else if (row._id.status === ScheduleStatus.MISSED) entry.missed += row.count
    else if (row._id.status === ScheduleStatus.CANCELLED) entry.cancelled += row.count
  }

  return {
    totalPending: get(result.totalPending),
    overdueCount: get(result.overdue),
    dueTodayCount: get(result.dueToday),
    dueThisWeekCount: get(result.dueThisWeek),
    completedThisMonthCount: get(result.completedThisMonth),
    completionRatePct,
    byType: Array.from(byTypeMap.values()),
  }
}
