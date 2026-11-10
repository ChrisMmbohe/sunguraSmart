"use server";

import { z } from "zod";
import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { dbConnect, Breeding, BreedingMethod, BreedingStatus, Gender, Rabbit, RabbitStatus, Schedule, ScheduleStatus, ScheduleType } from "@/database";
import { addDays } from "@/database/utils/ownership.util";

type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated.");
  return userId;
}

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Invalid input." };
  return { ok: false, error: err instanceof Error ? err.message : "Something went wrong." };
}

const createBreedingSchema = z.object({
  doeId: z.string().min(1, "Select a doe."),
  buckId: z.string().min(1, "Select a buck."),
  method: z.nativeEnum(BreedingMethod),
  pairedDate: z.coerce.date(),
  notes: z.string().trim().optional(),
});

export type CreateBreedingInput = z.infer<typeof createBreedingSchema>;

const editBreedingSchema = createBreedingSchema.extend({
  breedingId: z.string().min(1),
});

export type EditBreedingInput = z.infer<typeof editBreedingSchema>;

const BREEDING_MILESTONES = {
  CONFIRM_PREGNANCY: "confirm_pregnancy",
  PLACE_NEST_BOX: "place_nest_box",
  EXPECTED_KINDLE: "expected_kindle",
} as const;

async function createBreedingScheduleItems(userId: string, breeding: typeof Breeding.prototype, doeLabel: string) {
  const dueDate = breeding.expectedDueDate;
  await Schedule.create([
    {
      userId,
      title: `Confirm pregnancy: ${doeLabel}`,
      type: ScheduleType.BREEDING_FOLLOWUP,
      rabbit: breeding.doe,
      dueDate: addDays(breeding.pairedDate, 14),
      relatedBreeding: breeding._id,
      relatedBreedingMilestone: BREEDING_MILESTONES.CONFIRM_PREGNANCY,
    },
    {
      userId,
      title: `Place nest box: ${doeLabel}`,
      type: ScheduleType.BREEDING_FOLLOWUP,
      rabbit: breeding.doe,
      dueDate: addDays(dueDate, -2),
      relatedBreeding: breeding._id,
      relatedBreedingMilestone: BREEDING_MILESTONES.PLACE_NEST_BOX,
    },
    {
      userId,
      title: `Expected kindling: ${doeLabel}`,
      type: ScheduleType.BREEDING_FOLLOWUP,
      rabbit: breeding.doe,
      dueDate,
      relatedBreeding: breeding._id,
      relatedBreedingMilestone: BREEDING_MILESTONES.EXPECTED_KINDLE,
    },
  ]);
}

async function updateBreedingScheduleItems(userId: string, breedingId: string, status: BreedingStatus, statusDate: Date) {
  const schedules = await Schedule.find({ userId, relatedBreeding: breedingId });
  for (const schedule of schedules) {
    if (schedule.status !== ScheduleStatus.PENDING) continue;
    if (status === BreedingStatus.CONFIRMED_PREGNANT && schedule.relatedBreedingMilestone === BREEDING_MILESTONES.CONFIRM_PREGNANCY) {
      schedule.status = ScheduleStatus.COMPLETED;
      schedule.completedDate = statusDate;
    } else if (status === BreedingStatus.FAILED || status === BreedingStatus.ABORTED) {
      schedule.status = ScheduleStatus.CANCELLED;
    }
    await schedule.save();
  }
}

export async function createBreedingAction(input: CreateBreedingInput): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await requireUserId();
    const parsed = createBreedingSchema.parse(input);
    await dbConnect();
    const [doe, buck] = await Promise.all([
      Rabbit.findOne({ _id: parsed.doeId, userId, gender: Gender.FEMALE, status: RabbitStatus.ACTIVE }),
      Rabbit.findOne({ _id: parsed.buckId, userId, gender: Gender.MALE, status: RabbitStatus.ACTIVE }),
    ]);
    if (!doe) throw new Error("Select an active doe on this farm.");
    if (!buck) throw new Error("Select an active buck on this farm.");
    const breeding = await Breeding.create({
      userId,
      doe: parsed.doeId,
      buck: parsed.buckId,
      method: parsed.method,
      pairedDate: parsed.pairedDate,
      notes: parsed.notes,
      status: BreedingStatus.PAIRED,
    });
    await createBreedingScheduleItems(userId, breeding, doe.name ? `${doe.name} (${doe.tagNumber})` : doe.tagNumber);
    revalidatePath("/breeding");
    revalidatePath("/dashboard");
    revalidatePath("/schedule");
    return { ok: true, data: { id: String(breeding._id) } };
  } catch (err) {
    return fail(err);
  }
}

const updateBreedingSchema = z.object({
  breedingId: z.string().min(1),
  status: z.enum([BreedingStatus.CONFIRMED_PREGNANT, BreedingStatus.FAILED, BreedingStatus.ABORTED]),
  statusDate: z.coerce.date(),
  failureReason: z.string().trim().optional(),
});

export type UpdateBreedingInput = z.infer<typeof updateBreedingSchema>;

export async function updateBreedingStatusAction(input: UpdateBreedingInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = updateBreedingSchema.parse(input);
    if ([BreedingStatus.FAILED, BreedingStatus.ABORTED].includes(parsed.status) && !parsed.failureReason) {
      throw new Error("Add a reason for a failed or aborted breeding.");
    }
    await dbConnect();
    const breeding = await Breeding.findOne({ _id: parsed.breedingId, userId });
    if (!breeding) throw new Error("Breeding record not found.");
    if (![BreedingStatus.PAIRED, BreedingStatus.CONFIRMED_PREGNANT].includes(breeding.status)) {
      throw new Error("Only active breeding records can be updated.");
    }
    breeding.status = parsed.status;
    if (parsed.status === BreedingStatus.CONFIRMED_PREGNANT) {
      breeding.confirmedPregnantDate = parsed.statusDate;
      breeding.failureReason = undefined;
    } else {
      breeding.failureReason = parsed.failureReason;
    }
    await breeding.save();
    await updateBreedingScheduleItems(userId, String(breeding._id), parsed.status, parsed.statusDate);
    revalidatePath("/breeding");
    revalidatePath("/dashboard");
    revalidatePath("/litters");
    revalidatePath("/schedule");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function updateBreedingAction(input: EditBreedingInput): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const parsed = editBreedingSchema.parse(input);
    await dbConnect();
    const [breeding, doe, buck] = await Promise.all([
      Breeding.findOne({ _id: parsed.breedingId, userId }),
      Rabbit.findOne({ _id: parsed.doeId, userId, gender: Gender.FEMALE, status: RabbitStatus.ACTIVE }),
      Rabbit.findOne({ _id: parsed.buckId, userId, gender: Gender.MALE, status: RabbitStatus.ACTIVE }),
    ]);
    if (!breeding) throw new Error("Breeding record not found.");
    if (breeding.litter) throw new Error("Breeding records with a litter cannot be edited.");
    if (!doe) throw new Error("Select an active doe on this farm.");
    if (!buck) throw new Error("Select an active buck on this farm.");

    breeding.doe = new Types.ObjectId(parsed.doeId);
    breeding.buck = new Types.ObjectId(parsed.buckId);
    breeding.method = parsed.method;
    breeding.pairedDate = parsed.pairedDate;
    breeding.notes = parsed.notes;
    await breeding.save();

    await Schedule.updateMany(
      { userId, relatedBreeding: breeding._id, status: ScheduleStatus.PENDING },
      { rabbit: breeding.doe }
    );
    const scheduleUpdates = [
      [BREEDING_MILESTONES.CONFIRM_PREGNANCY, addDays(breeding.pairedDate, 14)],
      [BREEDING_MILESTONES.PLACE_NEST_BOX, addDays(breeding.expectedDueDate, -2)],
      [BREEDING_MILESTONES.EXPECTED_KINDLE, breeding.expectedDueDate],
    ] as const;
    for (const [milestone, dueDate] of scheduleUpdates) {
      await Schedule.updateOne(
        { userId, relatedBreeding: breeding._id, relatedBreedingMilestone: milestone, status: ScheduleStatus.PENDING },
        { dueDate, rabbit: breeding.doe }
      );
    }

    revalidatePath("/breeding");
    revalidatePath("/dashboard");
    revalidatePath("/schedule");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteBreedingAction(breedingId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    await dbConnect();
    const breeding = await Breeding.findOne({ _id: breedingId, userId });
    if (!breeding) throw new Error("Breeding record not found.");
    if (breeding.litter) throw new Error("Breeding records with a litter cannot be deleted. Delete the litter first.");
    await Schedule.deleteMany({ userId, relatedBreeding: breeding._id });
    await Breeding.deleteOne({ _id: breeding._id, userId });
    revalidatePath("/breeding");
    revalidatePath("/dashboard");
    revalidatePath("/schedule");
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}