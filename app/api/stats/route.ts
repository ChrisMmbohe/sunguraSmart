import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import {
  Breeding,
  Litter,
  HealthRecord,
  Rabbit,
  Sale,
  FeedLog,
  Cage,
  Expense,
} from "@/database/index";

/**
 * @route GET /api/stats
 * @description Fetches comprehensive dashboard statistics from the database
 * @access Protected (Clerk user required)
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    const userId = user.id;

    await connectDB();

    // ===== POPULATION DATA =====
    // We update the fetching logic to actually count Quarantined and Active rabbits
    const [total, active, quarantined, sick, kit] = await Promise.all([
      Rabbit.countDocuments({
        user_id: userId,
        status: { $nin: ["Culled", "Deceased", "Sold"] },
      }),
      Rabbit.countDocuments({ user_id: userId, status: "Active" }),
      Rabbit.countDocuments({ user_id: userId, status: "Quarantined" }),
      Rabbit.countDocuments({ user_id: userId, status: "Sick" }),
      Rabbit.countDocuments({ user_id: userId, status: "Kit" }),
    ]);

    const populationStats = {
      total,
      active,
      quarantined,
      sick,
      kit,
    };

    // ===== BREEDING DATA =====
    // Date ranges for queries
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);

    // Calculate kindling rate from breedings in last 60 days
    const breedingStats = await Breeding.aggregate([
      {
        $match: {
          user_id: userId,
          mating_date: { $gte: sixtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          total_breedings: { $sum: 1 },
          successful_breedings: {
            $sum: { $cond: [{ $eq: ["$is_successful", true] }, 1, 0] },
          },
        },
      },
    ]);

    const totalBreedings = breedingStats[0]?.total_breedings || 0;
    const successfulBreedings = breedingStats[0]?.successful_breedings || 0;
    const kindlingRatePct =
      totalBreedings > 0 ? (successfulBreedings / totalBreedings) * 100 : 0;

    // Average litter size and active litters - last 60 days

    const litterStats = await Litter.aggregate([
      { $match: { user_id: userId, kindling_date: { $gte: sixtyDaysAgo } } },
      {
        $group: {
          _id: null,
          avg_size: { $avg: "$total_kits_born" },
          active_count: {
            $sum: {
              $cond: [{ $eq: ["$status", "Active"] }, 1, 0],
            },
          },
          total_litters: { $sum: 1 },
          total_born: { $sum: "$total_kits_born" },
          total_surviving: { $sum: "$kits_surviving" }, // Use kits_surviving for accurate survival rate
          weaned_litters: {
            $sum: { $cond: [{ $eq: ["$status", "Weaned"] }, 1, 0] },
          },
        },
      },
    ]);

    const avgLitterSize = litterStats[0]?.avg_size || 0;
    const activeLitters = litterStats[0]?.active_count || 0;
    const kitsBorn = litterStats[0]?.total_born || 0;
    const kitsSurviving = litterStats[0]?.total_surviving || 0;

    // Calculate weaning survival rate
    const weaningSurvivalRate =
      kitsBorn > 0 ? (kitsSurviving / kitsBorn) * 100 : 0;

    // ===== FINANCIAL DATA =====

    // Revenue this month
    const revenueData = await Sale.aggregate([
      {
        $match: {
          user_id: userId,
          sale_date: { $gte: thisMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$price_usd" },
        },
      },
    ]);
    const monthlyIncome = revenueData[0]?.total || 0;

    // Expenses this month
    const expenseData = await Expense.aggregate([
      {
        $match: {
          user_id: userId,
          transaction_date: { $gte: thisMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount_usd" },
        },
      },
    ]);
    const monthlyExpenses = expenseData[0]?.total || 0;
    const profit = monthlyIncome - monthlyExpenses;

    // ===== HEALTH DATA =====
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sickCount = await (HealthRecord as any).getSickCount(userId);

    // Mortality rate (last 30 days)
    const deaths = await Rabbit.countDocuments({
      user_id: userId,
      status: "Deceased",
      updatedAt: { $gte: thirtyDaysAgo },
    });
    const mortalityRate =
      populationStats.total > 0 ? (deaths / populationStats.total) * 100 : 0;

    // ===== FEED DATA =====
    const feedEfficiency = await FeedLog.aggregate([
      { $match: { user_id: userId, date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          total_used: { $sum: "$quantity_used" },
          avg_rabbits: { $avg: "$rabbits_covered" },
        },
      },
    ]);

    const efficiencyRatio =
      feedEfficiency[0]?.total_used && feedEfficiency[0]?.avg_rabbits
        ? feedEfficiency[0].total_used / feedEfficiency[0].avg_rabbits
        : 0;

    // ===== CAGE DATA =====
    const cageStats = await Cage.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: null,
          total_capacity: { $sum: "$capacity" },
          total_occupants: {
            $sum: { $size: { $ifNull: ["$current_occupants", []] } },
          },
        },
      },
    ]);

    const totalCapacity = cageStats[0]?.total_capacity || 0;
    const totalOccupants = cageStats[0]?.total_occupants || 0;
    const occupancyPct =
      totalCapacity > 0 ? (totalOccupants / totalCapacity) * 100 : 0;
    const availableSlots = Math.max(0, totalCapacity - totalOccupants);

    return NextResponse.json({
      population: {
        total: populationStats.total,
        active: populationStats.active,
        quarantined: populationStats.quarantined,
        kit: activeLitters > 0 ? kitsBorn : populationStats.kit, // Fallback logic
      },
      breeding: {
        kindling_rate_pct: kindlingRatePct || 0,
        weaning_survival_rate_pct: weaningSurvivalRate || 0,
        avg_litter_size: avgLitterSize || 0,
        active_litters: activeLitters || 0,
        kits_born_this_month: kitsBorn || 0,
      },
      financial: {
        income: monthlyIncome || 0,
        profit: profit || 0,
      },
      health: {
        sick: sickCount || 0,
        mortality_rate_pct: mortalityRate || 0,
      },
      feed: {
        efficiency_ratio: efficiencyRatio || 0,
      },
      cages: {
        occupancy_pct: occupancyPct || 0,
        available_slots: availableSlots || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
