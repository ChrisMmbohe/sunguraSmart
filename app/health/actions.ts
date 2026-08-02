"use server"

import mongoose from "mongoose"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import {
  dbConnect,
  HealthRecord,
  Disease,
  Schedule,
  ScheduleStatus,
  ScheduleType,
  HealthRecordOutcome,
} from "@/database"
import {
  healthRecordFormSchema,
  diseaseFormSchema,
  type HealthRecordFormValues,
  type DiseaseFormValues,
} from "./types"

export interface ActionResult {
  success: boolean
  error?: string
}

async function getAuthUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("You must be signed in.")
  return userId
}

function describeError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { code?: number; message?: string }
    if (anyErr.code === 11000) return "A disease with this name already exists on your farm."
    if (anyErr.message) return anyErr.message
  }
  return "Something went wrong. Please try again."
}

function toRecordDoc(values: HealthRecordFormValues) {
  return {
    rabbit: values.rabbit,
    type: values.type,
    disease: values.disease || null,
    date: new Date(values.date),
    treatment: values.treatment || undefined,
    medication: values.medication || undefined,
    dosage: values.dosage || undefined,
    cost: values.cost,
    outcome: values.outcome,
    followUpDate: values.followUpDate ? new Date(values.followUpDate) : undefined,
    notes: values.notes || undefined,
  }
}

const OPEN_SCHEDULE_STATUSES = [ScheduleStatus.PENDING]

/**
 * Keeps the Schedule collection in sync with a health record's follow-up
 * date, using Schedule.relatedHealthRecord — a field the model already
 * defines but that no hook was wiring up. Only touches schedule items
 * still pending, so a task someone already completed/missed/cancelled by
 * hand is never silently overwritten.
 */
async function syncFollowUpSchedule(
  userId: string,
  healthRecordId: string,
  rabbitId: string,
  followUpDate: Date | undefined,
  label: string
) {
  const existing = await Schedule.findOne({ userId, relatedHealthRecord: healthRecordId })

  if (!followUpDate) {
    if (existing && OPEN_SCHEDULE_STATUSES.includes(existing.status)) {
      existing.status = ScheduleStatus.CANCELLED
      await existing.save()
    }
    return
  }

  if (existing) {
    if (OPEN_SCHEDULE_STATUSES.includes(existing.status)) {
      existing.dueDate = followUpDate
      existing.title = label
      // existing.rabbit = rabbitId
      existing.rabbit = new mongoose.Types.ObjectId(rabbitId)
      await existing.save()
    }
    return
  }

  await Schedule.create({
    userId,
    title: label,
    type: ScheduleType.HEALTH_CHECK,
    // rabbit: rabbitId,
    rabbit: new mongoose.Types.ObjectId(rabbitId),
    dueDate: followUpDate,
    relatedHealthRecord: healthRecordId,
  })
}

export async function createHealthRecord(values: HealthRecordFormValues): Promise<ActionResult> {
  const parsed = healthRecordFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const record = new HealthRecord({ ...toRecordDoc(parsed.data), userId })
    await record.save()

    await syncFollowUpSchedule(
      userId,
      String(record._id),
      String(record.rabbit),
      record.followUpDate,
      `Follow-up: ${parsed.data.type.replace(/_/g, " ")}`
    )

    revalidatePath("/health")
    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function updateHealthRecord(id: string, values: HealthRecordFormValues): Promise<ActionResult> {
  const parsed = healthRecordFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const record = await HealthRecord.findOne({ _id: id, userId })
    if (!record) {
      return { success: false, error: "Health record not found on your farm." }
    }

    Object.assign(record, toRecordDoc(parsed.data))
    await record.save()

    await syncFollowUpSchedule(
      userId,
      String(record._id),
      String(record.rabbit),
      record.followUpDate,
      `Follow-up: ${parsed.data.type.replace(/_/g, " ")}`
    )

    revalidatePath("/health")
    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function deleteHealthRecord(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const result = await HealthRecord.deleteOne({ _id: id, userId })
    if (result.deletedCount === 0) {
      return { success: false, error: "Health record not found on your farm." }
    }

    const linkedSchedule = await Schedule.findOne({ userId, relatedHealthRecord: id })
    if (linkedSchedule && OPEN_SCHEDULE_STATUSES.includes(linkedSchedule.status)) {
      linkedSchedule.status = ScheduleStatus.CANCELLED
      await linkedSchedule.save()
    }

    revalidatePath("/health")
    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

/** Quick outcome change from the row actions menu — same rabbit healthStatus sync fires via the model hook. */
export async function setHealthRecordOutcome(id: string, outcome: HealthRecordOutcome): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const record = await HealthRecord.findOne({ _id: id, userId })
    if (!record) {
      return { success: false, error: "Health record not found on your farm." }
    }

    record.outcome = outcome
    await record.save()

    revalidatePath("/health")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

// ---------------------------------------------------------------------------
// Disease catalog
// ---------------------------------------------------------------------------

function toDiseaseDoc(values: DiseaseFormValues) {
  return {
    name: values.name,
    symptoms: values.symptoms
      ? values.symptoms.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    defaultSeverity: values.defaultSeverity,
    isContagious: values.isContagious,
    recommendedTreatment: values.recommendedTreatment || undefined,
    preventionNotes: values.preventionNotes || undefined,
  }
}

export async function createDisease(values: DiseaseFormValues): Promise<ActionResult> {
  const parsed = diseaseFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const disease = new Disease({ ...toDiseaseDoc(parsed.data), userId })
    await disease.save()

    revalidatePath("/health")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function updateDisease(id: string, values: DiseaseFormValues): Promise<ActionResult> {
  const parsed = diseaseFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const disease = await Disease.findOne({ _id: id, userId })
    if (!disease) {
      return { success: false, error: "Disease not found on your farm." }
    }

    Object.assign(disease, toDiseaseDoc(parsed.data))
    await disease.save()

    revalidatePath("/health")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function deleteDisease(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const referenceCount = await HealthRecord.countDocuments({ userId, disease: id })
    if (referenceCount > 0) {
      return {
        success: false,
        error: `Can't delete — ${referenceCount} health record${referenceCount === 1 ? "" : "s"} still reference this disease.`,
      }
    }

    const result = await Disease.deleteOne({ _id: id, userId })
    if (result.deletedCount === 0) {
      return { success: false, error: "Disease not found on your farm." }
    }

    revalidatePath("/health")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}
