"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { Types } from "mongoose"
import { dbConnect, Schedule, ScheduleStatus, RecurrenceFrequency } from "@/database"
import { scheduleFormSchema, type ScheduleFormValues } from "./types"

export interface ActionResult {
  success: boolean
  error?: string
  fieldErrors?: Partial<Record<keyof ScheduleFormValues, string>>
}

async function getAuthUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error("You must be signed in.")
  return userId
}

function describeError(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as { message?: string }
    if (anyErr.message) return anyErr.message
  }
  return "Something went wrong. Please try again."
}

function toDoc(values: ScheduleFormValues) {
  return {
    title: values.title,
    type: values.type,
    rabbit: values.rabbit || null,
    dueDate: new Date(values.dueDate),
    recurrence: {
      frequency: values.recurrenceFrequency,
      customDays:
        values.recurrenceFrequency === RecurrenceFrequency.CUSTOM_DAYS ? values.recurrenceCustomDays : undefined,
    },
    notes: values.notes || undefined,
  }
}

export async function createSchedule(values: ScheduleFormValues): Promise<ActionResult> {
  const parsed = scheduleFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const schedule = new Schedule({ ...toDoc(parsed.data), userId })
    await schedule.save()

    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function updateSchedule(id: string, values: ScheduleFormValues): Promise<ActionResult> {
  const parsed = scheduleFormSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: "Please fix the highlighted fields." }
  }

  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const schedule = await Schedule.findOne({ _id: id, userId })
    if (!schedule) {
      return { success: false, error: "Schedule item not found on your farm." }
    }

    Object.assign(schedule, toDoc(parsed.data))
    if (parsed.data.status) {
      schedule.status = parsed.data.status
      if (parsed.data.status === ScheduleStatus.COMPLETED && !schedule.completedDate) {
        schedule.completedDate = new Date()
      }
      if (parsed.data.status !== ScheduleStatus.COMPLETED) {
        schedule.completedDate = undefined
      }
    }
    await schedule.save()

    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function deleteSchedule(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const result = await Schedule.deleteOne({ _id: id, userId })
    if (result.deletedCount === 0) {
      return { success: false, error: "Schedule item not found on your farm." }
    }

    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

/**
 * Marks a schedule item completed via the model's static, which also
 * auto-creates the next occurrence for recurring items (e.g. quarterly
 * deworming) — this is the same automation used by the seed data hooks.
 */
export async function markScheduleCompleted(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const result = await Schedule.markCompleted(userId, new Types.ObjectId(id))
    if (!result) {
      return { success: false, error: "Schedule item not found on your farm." }
    }

    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

/** Manual override for a task that was never done — does not spawn the next recurrence. */
export async function markScheduleMissed(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const schedule = await Schedule.findOne({ _id: id, userId })
    if (!schedule) {
      return { success: false, error: "Schedule item not found on your farm." }
    }

    schedule.status = ScheduleStatus.MISSED
    await schedule.save()

    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

export async function cancelSchedule(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const schedule = await Schedule.findOne({ _id: id, userId })
    if (!schedule) {
      return { success: false, error: "Schedule item not found on your farm." }
    }

    schedule.status = ScheduleStatus.CANCELLED
    await schedule.save()

    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}

/** Reopens a cancelled/missed item back to pending — used from the row menu as an "undo". */
export async function reopenSchedule(id: string): Promise<ActionResult> {
  try {
    const userId = await getAuthUserId()
    await dbConnect()

    const schedule = await Schedule.findOne({ _id: id, userId })
    if (!schedule) {
      return { success: false, error: "Schedule item not found on your farm." }
    }

    schedule.status = ScheduleStatus.PENDING
    schedule.completedDate = undefined
    await schedule.save()

    revalidatePath("/schedule")
    return { success: true }
  } catch (err) {
    return { success: false, error: describeError(err) }
  }
}
