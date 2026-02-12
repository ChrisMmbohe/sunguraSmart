import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import connectDB from "@/lib/mongodb";
import {
  Breeding,
  Litter,
  HealthRecord,
  Rabbit,
  Sale,
} from "@/database/index";

/**
 * @route GET /api/dashboard/activity
 * @description Fetches recent activity for the dashboard
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

    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description?: string;
      timestamp: Date;
      status: string;
      relatedId?: string;
    }> = [];

    // Fetch recent breedings (last 30 days)
    const recentBreedings = await Breeding.find({
      user_id: userId,
      mating_date: {
        $gte: new Date(Date.now() - 30 * 86400000),
      },
    })
      .sort({ mating_date: -1 })
      .limit(5)
      .lean();

    recentBreedings.forEach((breeding: Record<string, unknown>) => {
      const id = breeding._id instanceof ObjectId ? breeding._id.toString() : String(breeding._id);
      activities.push({
        id,
        type: "breeding",
        title: `Breeding scheduled`,
        description: `${breeding.doe_id} and ${breeding.buck_id}`,
        timestamp: (breeding.mating_date as Date) || new Date(),
        status: breeding.is_successful ? "success" : "info",
        relatedId: id,
      });
    });

    // Fetch recent litters (last 30 days)
    const recentLitters = await Litter.find({
      user_id: userId,
      kindling_date: {
        $gte: new Date(Date.now() - 30 * 86400000),
      },
    })
      .sort({ kindling_date: -1 })
      .limit(5)
      .lean();

    recentLitters.forEach((litter: Record<string, unknown>) => {
      const id = litter._id instanceof ObjectId ? litter._id.toString() : String(litter._id);
      activities.push({
        id,
        type: "litter",
        title: `Litter born`,
        description: `${litter.total_kits_born} kits from ${litter.doe_id}`,
        timestamp: (litter.kindling_date as Date) || new Date(),
        status: "success",
        relatedId: id,
      });
    });

    // Fetch recent sales (last 30 days)
    const recentSales = await Sale.find({
      user_id: userId,
      sale_date: {
        $gte: new Date(Date.now() - 30 * 86400000),
      },
    })
      .sort({ sale_date: -1 })
      .limit(5)
      .lean();

    recentSales.forEach((sale: Record<string, unknown>) => {
      const id = sale._id instanceof ObjectId ? sale._id.toString() : String(sale._id);
      activities.push({
        id,
        type: "sale",
        title: `Rabbit sold`,
        description: `$${sale.price_usd} from ${sale.rabbit_id}`,
        timestamp: (sale.sale_date as Date) || new Date(),
        status: "success",
        relatedId: id,
      });
    });

    // Fetch recent health records (last 30 days)
    const recentHealthRecords = await HealthRecord.find({
      user_id: userId,
      date: {
        $gte: new Date(Date.now() - 30 * 86400000),
      },
    })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    recentHealthRecords.forEach((record: Record<string, unknown>) => {
      const id = record._id instanceof ObjectId ? record._id.toString() : String(record._id);
      const status = record.is_sick ? "warning" : "info";
      activities.push({
        id,
        type: "health",
        title: `Health record`,
        description: `${record.condition} for ${record.rabbit_id}`,
        timestamp: (record.date as Date) || new Date(),
        status,
        relatedId: id,
      });
    });

    // Check for alerts
    const sickRabbits = await Rabbit.countDocuments({
      user_id: userId,
      status: "Sick",
    });

    if (sickRabbits > 0) {
      activities.push({
        id: `alert-sick-${Date.now()}`,
        type: "alert",
        title: `Health Alert`,
        description: `${sickRabbits} rabbit(s) need attention`,
        timestamp: new Date(),
        status: "warning",
      });
    }

    // Check cage occupancy
    const cageOccupancy = await Rabbit.countDocuments({
      user_id: userId,
      status: { $nin: ["Culled", "Deceased", "Sold"] },
    });

    if (cageOccupancy > 0) {
      const occupancyRatio = cageOccupancy / 100; // Assuming 100 is max capacity
      if (occupancyRatio > 0.9) {
        activities.push({
          id: `alert-cage-${Date.now()}`,
          type: "alert",
          title: `Cage Alert`,
          description: `Cages are ${Math.round(occupancyRatio * 100)}% full`,
          timestamp: new Date(),
          status: "warning",
        });
      }
    }

    // Sort all activities by timestamp and limit to 10
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json(activities.slice(0, 10));
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
