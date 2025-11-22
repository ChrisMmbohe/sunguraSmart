// app/api/cage/route.ts   ← FIXED & IMPROVED VERSION
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cage from "@/database/cage.model";

/**
 * POST: Create a new cage (unchanged, just cleaner)
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const { cage_id, capacity = 1, location = null, notes = null } = body;

    if (!cage_id || typeof cage_id !== "string" || cage_id.trim() === "") {
      return NextResponse.json(
        { message: "cage_id is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (capacity < 1 || !Number.isInteger(capacity)) {
      return NextResponse.json(
        { message: "capacity must be an integer ≥ 1" },
        { status: 400 }
      );
    }

    const newCage = await Cage.create({
      cage_id: cage_id.trim().toUpperCase(),
      capacity,
      location: location?.trim() || null,
      notes: notes?.trim() || null,
    });

    return NextResponse.json(
      {
        message: "Cage created successfully",
        cage: newCage.toObject({ virtuals: true }),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Cage creation error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { message: `Cage with ID "${error.keyValue?.cage_id}" already exists` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create cage", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch cages with powerful filtering
 *
 * Supported query parameters:
 *   ?location=barn              → case-insensitive partial match
 *   ?available=true             → only cages with available_slots > 0
 *   ?full=true                  → only completely full cages
 *   ?occupancy_gt=2             → occupancy > 2
 *   ?occupancy_gte=3            → occupancy ≥ 3
 *   ?occupancy_lt=5             → occupancy < 5
 *   ?occupancy_lte=4            → occupancy ≤ 4
 *   ?occupancy=6                → exact occupancy
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Basic MongoDB filter (only for stored fields)
    const filter: any = {};

    const location = searchParams.get("location");
    if (location) {
      filter.location = new RegExp(location.trim(), "i");
    }

    // Fetch all matching cages and populate occupancy count
    const cageDocs = await Cage.find(filter)
      .sort({ cage_id: 1 })
      .populate("occupancy") // ← adds occupancy count
      .exec();

    // Convert to plain objects with ALL virtuals (available_slots, is_full, etc.)
    let cages = cageDocs.map((doc) => doc.toObject({ virtuals: true }));

    // Post-processing filters (for virtuals)
    const available = searchParams.get("available");
    const full = searchParams.get("full");

    const occExact = searchParams.get("occupancy");
    const occGt = searchParams.get("occupancy_gt");
    const occGte = searchParams.get("occupancy_gte");
    const occLt = searchParams.get("occupancy_lt");
    const occLte = searchParams.get("occupancy_lte");

    if (available === "true") {
      cages = cages.filter((c) => c.available_slots > 0);
    }

    if (full === "true") {
      cages = cages.filter((c) => c.is_full === true);
    }

    if (occExact !== null) {
      const val = parseInt(occExact, 10);
      if (!isNaN(val)) cages = cages.filter((c) => (c.occupancy || 0) === val);
    }

    if (occGt !== null) {
      const val = parseInt(occGt, 10);
      if (!isNaN(val)) cages = cages.filter((c) => (c.occupancy || 0) > val);
    }

    if (occGte !== null) {
      const val = parseInt(occGte, 10);
      if (!isNaN(val)) cages = cages.filter((c) => (c.occupancy || 0) >= val);
    }

    if (occLt !== null) {
      const val = parseInt(occLt, 10);
      if (!isNaN(val)) cages = cages.filter((c) => (c.occupancy || 0) < val);
    }

    if (occLte !== null) {
      const val = parseInt(occLte, 10);
      if (!isNaN(val)) cages = cages.filter((c) => (c.occupancy || 0) <= val);
    }

    return NextResponse.json(
      {
        message: "Cages fetched successfully",
        count: cages.length,
        cages,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fetch cages error:", error);
    return NextResponse.json(
      { message: "Failed to fetch cages", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}