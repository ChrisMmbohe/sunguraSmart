import "server-only"

import { auth } from "@clerk/nextjs/server"
import {
  dbConnect,
  HealthRecord,
  Disease,
  Rabbit,
  RabbitStatus,
  HealthRecordOutcome,
} from "@/database"
import { HealthRecordType, HealthStatus } from "@/types/enums"
import type {
  HealthRecordTableData,
  HealthRecordFormOptions,
  DiseaseTableData,
  HealthAnalyticsSummary,
  HealthTypeBreakdown,
  HealthOutcomeBreakdown,
  FollowUpUrgency,
} from "@/app/health/types"

function requireUserId(userId: string | null): asserts userId is string {
  if (!userId) {
    throw new Error("Not authenticated.")
  }
}

const OPEN_OUTCOMES = [HealthRecordOutcome.ONGOING, HealthRecordOutcome.CHRONIC]

function computeFollowUpUrgency(
  outcome: HealthRecordOutcome,
  followUpDate: Date | undefined,
  now: Date
): FollowUpUrgency {
  if (outcome === HealthRecordOutcome.RECOVERED || outcome === HealthRecordOutcome.DECEASED) return "Resolved"
  if (!followUpDate) return "No follow-up"

  const diffDays = (followUpDate.getTime() - now.getTime()) / 86_400_000
  if (diffDays < 0) return "Overdue"
  if (diffDays < 1) return "Due today"
  if (diffDays <= 7) return "Due this week"
  return "Upcoming"
}

/**
 * Fetches every health record belonging to the current tenant, populated
 * with rabbit + disease display data, and shaped for the table, calendar,
 * and search — mirroring the Schedule page's single-fetch pattern.
 */
export async function getHealthRecordsForTable(): Promise<HealthRecordTableData[]> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const records = await HealthRecord.find({ userId })
    .populate({ path: "rabbit", select: "name tagNumber" })
    .populate({ path: "disease", select: "name isContagious" })
    .sort({ date: -1 })
    .lean<any[]>()

  const now = new Date()

  return records.map((r) => {
    const followUpDate = r.followUpDate ? new Date(r.followUpDate) : undefined

    return {
      id: String(r._id),
      rabbitId: String(r.rabbit?._id ?? r.rabbit),
      rabbitLabel: r.rabbit?.name || r.rabbit?.tagNumber || "Unknown rabbit",
      type: r.type,
      diseaseId: r.disease ? String(r.disease._id ?? r.disease) : undefined,
      diseaseName: r.disease?.name,
      diseaseContagious: r.disease?.isContagious,
      date: new Date(r.date).toISOString(),
      treatment: r.treatment,
      medication: r.medication,
      dosage: r.dosage,
      cost: r.cost,
      outcome: r.outcome,
      followUpDate: followUpDate?.toISOString(),
      followUpUrgency: computeFollowUpUrgency(r.outcome, followUpDate, now),
      notes: r.notes,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    }
  })
}

/** Active rabbits + the disease catalog, for the health record form's selects. */
export async function getHealthFormOptions(): Promise<HealthRecordFormOptions> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const [rabbits, diseases] = await Promise.all([
    Rabbit.find({ userId, status: RabbitStatus.ACTIVE }).select("name tagNumber").sort({ tagNumber: 1 }).lean<any[]>(),
    Disease.find({ userId }).select("name isContagious defaultSeverity").sort({ name: 1 }).lean<any[]>(),
  ])

  return {
    rabbits: rabbits.map((r) => ({
      value: String(r._id),
      label: r.name ? `${r.name} (#${r.tagNumber})` : `#${r.tagNumber}`,
    })),
    diseases: diseases.map((d) => ({
      value: String(d._id),
      label: d.name,
      isContagious: d.isContagious,
      defaultSeverity: d.defaultSeverity,
    })),
  }
}

/** The full disease catalog for the "Manage diseases" dialog, with a reference count for delete-safety. */
export async function getDiseasesForTable(): Promise<DiseaseTableData[]> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const diseases = await Disease.find({ userId }).sort({ name: 1 }).lean<any[]>()
  const counts = await HealthRecord.aggregate([
    { $match: { userId, disease: { $ne: null } } },
    { $group: { _id: "$disease", count: { $sum: 1 } } },
  ])
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]))

  return diseases.map((d) => ({
    id: String(d._id),
    name: d.name,
    symptoms: d.symptoms ?? [],
    defaultSeverity: d.defaultSeverity,
    isContagious: d.isContagious,
    recommendedTreatment: d.recommendedTreatment,
    preventionNotes: d.preventionNotes,
    recordCount: countMap.get(String(d._id)) ?? 0,
  }))
}

/**
 * Farm-wide health analytics for the summary tiles and charts. Reuses
 * Rabbit.getPopulationStats for the "currently sick/recovering/quarantined"
 * counts (already tenant-scoped and deceased-excluded) and runs a single
 * $facet aggregation over HealthRecord for everything else.
 */
export async function getHealthAnalytics(): Promise<HealthAnalyticsSummary> {
  const { userId } = await auth()
  requireUserId(userId)
  await dbConnect()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const weekFromNow = new Date(now.getTime() + 7 * 86_400_000)
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [population, [facetResult]] = await Promise.all([
    Rabbit.getPopulationStats(userId),
    HealthRecord.aggregate([
      { $match: { userId } },
      {
        $facet: {
          recordsThisMonth: [{ $match: { date: { $gte: startOfMonth } } }, { $count: "count" }],
          overdueFollowUps: [
            { $match: { outcome: { $in: OPEN_OUTCOMES }, followUpDate: { $lt: now, $ne: null } } },
            { $count: "count" },
          ],
          dueThisWeekFollowUps: [
            {
              $match: {
                outcome: { $in: OPEN_OUTCOMES },
                followUpDate: { $gte: now, $lte: weekFromNow },
              },
            },
            { $count: "count" },
          ],
          costThisMonth: [
            { $match: { date: { $gte: startOfMonth }, cost: { $ne: null } } },
            { $group: { _id: null, total: { $sum: "$cost" } } },
          ],
          outcomeBreakdown: [
            { $match: { date: { $gte: twelveMonthsAgo } } },
            { $group: { _id: "$outcome", count: { $sum: 1 } } },
          ],
          byType: [
            { $match: { date: { $gte: twelveMonthsAgo } } },
            { $group: { _id: "$type", count: { $sum: 1 } } },
          ],
          topDiseases: [
            { $match: { disease: { $ne: null } } },
            { $group: { _id: "$disease", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "diseases",
                localField: "_id",
                foreignField: "_id",
                as: "disease",
              },
            },
            { $unwind: "$disease" },
          ],
        },
      },
    ]),
  ])

  const get = (arr: any[]) => arr?.[0]?.count ?? 0

  const byHealthStatus = new Map(population.byHealthStatus.map((h) => [h.healthStatus, h.count]))

  const outcomeBreakdown: HealthOutcomeBreakdown[] = (facetResult.outcomeBreakdown ?? []).map((r: any) => ({
    outcome: r._id,
    count: r.count,
  }))

  const byTypeMap = new Map<HealthRecordType, number>()
  for (const t of Object.values(HealthRecordType)) byTypeMap.set(t, 0)
  for (const r of facetResult.byType ?? []) byTypeMap.set(r._id, r.count)
  const byType: HealthTypeBreakdown[] = Array.from(byTypeMap.entries()).map(([type, count]) => ({ type, count }))

  return {
    currentlySick: byHealthStatus.get(HealthStatus.SICK) ?? 0,
    currentlyRecovering: byHealthStatus.get(HealthStatus.RECOVERING) ?? 0,
    currentlyQuarantined: byHealthStatus.get(HealthStatus.QUARANTINED) ?? 0,
    recordsThisMonth: get(facetResult.recordsThisMonth),
    overdueFollowUps: get(facetResult.overdueFollowUps),
    dueThisWeekFollowUps: get(facetResult.dueThisWeekFollowUps),
    costThisMonth: facetResult.costThisMonth?.[0]?.total ?? 0,
    outcomeBreakdown,
    byType,
    topDiseases: (facetResult.topDiseases ?? []).map((r: any) => ({
      diseaseId: String(r._id),
      name: r.disease.name,
      isContagious: r.disease.isContagious,
      count: r.count,
    })),
  }
}
