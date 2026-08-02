import "server-only";

import { auth } from "@clerk/nextjs/server";
import { dbConnect, Litter, Breeding, BreedingStatus } from "@/database";
import type {
  LitterTableData,
  BreedingOption,
  LitterAnalyticsSummary,
  LitterMortalityEventDTO,
} from "@/app/litters/types";

function requireUserId(userId: string | null): asserts userId is string {
  if (!userId) {
    throw new Error("Not authenticated.");
  }
}

/**
 * Fetches every litter belonging to the current tenant, fully populated
 * with doe/buck/breed display data, and shaped for the data table + search.
 */
export async function getLittersForTable(): Promise<LitterTableData[]> {
  const { userId } = await auth();
  requireUserId(userId);
  await dbConnect();

  const litters = await Litter.find({ userId })
    .populate({
      path: "doe",
      select: "name tagNumber breed",
      populate: { path: "breed", select: "name" },
    })
    .populate({ path: "buck", select: "name tagNumber" })
    .sort({ kindleDate: -1 })
    .lean();

  return litters.map((l: any) => {
    const lostCount = (l.mortalityEvents ?? []).reduce(
      (sum: number, e: any) => sum + e.count,
      0
    );
    const kitsAlive = Math.max(0, l.kitsBornAlive - lostCount);
    const weaned = l.weaningDate != null || l.kitsWeaned != null;

    const survivalRatePct =
      weaned && l.kitsBornAlive > 0
        ? Math.round(((l.kitsWeaned ?? 0) / l.kitsBornAlive) * 1000) / 10
        : null;

    return {
      id: String(l._id),
      breedingId: String(l.breeding),

      doeId: String(l.doe?._id ?? l.doe),
      doeName: l.doe?.name || l.doe?.tagNumber || "Unknown doe",
      doeTagNumber: l.doe?.tagNumber ?? "",

      buckId: String(l.buck?._id ?? l.buck),
      buckName: l.buck?.name || l.buck?.tagNumber || "Unknown buck",
      buckTagNumber: l.buck?.tagNumber ?? "",

      breedId: String(l.doe?.breed?._id ?? ""),
      breedName: l.doe?.breed?.name ?? "Unknown breed",

      kindleDate: new Date(l.kindleDate).toISOString(),
      kitsBornAlive: l.kitsBornAlive,
      kitsBornDead: l.kitsBornDead,
      mortalityCount: lostCount,
      kitsAlive,
      kitsWeaned: l.kitsWeaned ?? null,
      weaningDate: l.weaningDate ? new Date(l.weaningDate).toISOString() : null,

      status: weaned ? "weaned" : "active",
      survivalRatePct,
      hasLosses: lostCount > 0,

      mortalityEvents: (l.mortalityEvents ?? []).map(
        (e: any): LitterMortalityEventDTO => ({
          date: new Date(e.date).toISOString(),
          count: e.count,
          cause: e.cause,
        })
      ),
      notes: l.notes,

      createdAt: new Date(l.createdAt).toISOString(),
      updatedAt: new Date(l.updatedAt).toISOString(),
    };
  });
}

/**
 * Breedings that can legally become a new Litter: paired or confirmed
 * pregnant, and not already linked to a litter. Feeds the "Record New
 * Litter" dialog's breeding-pair picker.
 */
export async function getBreedingsAvailableForLitter(): Promise<BreedingOption[]> {
  const { userId } = await auth();
  requireUserId(userId);
  await dbConnect();

  const breedings = await Breeding.find({
    userId,
    litter: null,
    status: { $in: [BreedingStatus.PAIRED, BreedingStatus.CONFIRMED_PREGNANT] },
  })
    .populate("doe", "name tagNumber")
    .populate("buck", "name tagNumber")
    .sort({ expectedDueDate: 1 })
    .lean();

  const now = Date.now();

  return breedings.map((b: any) => ({
    id: String(b._id),
    doeId: String(b.doe?._id ?? b.doe),
    doeName: b.doe?.name || b.doe?.tagNumber || "Doe",
    buckId: String(b.buck?._id ?? b.buck),
    buckName: b.buck?.name || b.buck?.tagNumber || "Buck",
    pairedDate: new Date(b.pairedDate).toISOString(),
    expectedDueDate: new Date(b.expectedDueDate).toISOString(),
    status: b.status,
    isOverdue: new Date(b.expectedDueDate).getTime() < now,
  }));
}

/**
 * Farm-wide litter analytics for the summary bar. Combines the model's
 * built-in aggregation static with a couple of extra totals the page needs.
 */
export async function getLitterAnalyticsSummary(): Promise<LitterAnalyticsSummary> {
  const { userId } = await auth();
  requireUserId(userId);
  await dbConnect();

  const [base, totals] = await Promise.all([
    Litter.getLitterAnalytics(userId),
    Litter.aggregate([
      { $match: { userId } },
      {
        $addFields: { lost: { $sum: "$mortalityEvents.count" } },
      },
      {
        $group: {
          _id: null,
          totalLitters: { $sum: 1 },
          totalKitsBornAlive: { $sum: "$kitsBornAlive" },
          totalKitsBornDead: { $sum: "$kitsBornDead" },
          totalMortality: { $sum: "$lost" },
          totalWeaned: {
            $sum: { $cond: [{ $ne: ["$kitsWeaned", null] }, "$kitsWeaned", 0] },
          },
          weanedLitters: {
            $sum: { $cond: [{ $ne: ["$weaningDate", null] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const t = totals[0] ?? {
    totalLitters: 0,
    totalKitsBornAlive: 0,
    totalKitsBornDead: 0,
    totalMortality: 0,
    totalWeaned: 0,
    weanedLitters: 0,
  };

  const totalBorn = t.totalKitsBornAlive + t.totalKitsBornDead;

  return {
    totalLitters: t.totalLitters,
    activeLitters: base.activeLitters,
    weanedLitters: t.weanedLitters,
    avgLitterSize: base.avgLitterSize,
    avgWeaningSurvivalRate: base.avgWeaningSurvivalRate,
    kitsBornThisMonth: base.kitsBornThisMonth,
    totalKitsBornAlive: t.totalKitsBornAlive,
    totalKitsBornDead: t.totalKitsBornDead,
    totalMortality: t.totalMortality,
    totalWeaned: t.totalWeaned,
    stillbirthRatePct: totalBorn > 0 ? (t.totalKitsBornDead / totalBorn) * 100 : 0,
  };
}
