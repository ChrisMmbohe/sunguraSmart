// app/api/seed/cages/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cage from "@/database/cage.model";
import rabbitCages from "@/lib/seeds/rabbit-cages"; // adjust path if needed

export async function GET() {
  try {
    await connectDB();

    // Optional: Clear existing cages first (uncomment if you want fresh start)
    await Cage.deleteMany({});

    const result = await Cage.insertMany(rabbitCages);

    return NextResponse.json(
      {
        success: true,
        message: `${result.length} rabbit cages seeded successfully!`,
        count: result.length,
        cages: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Cage seeding failed:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Some cage_id already exist. Use a fresh DB or delete existing cages first.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Seeding failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}