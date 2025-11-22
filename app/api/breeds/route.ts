// app/api/breed/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Breed from "@/database/breed.model"; // assuming your model is exported from here

/**
 * POST: Create a new breed
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const rawData = Object.fromEntries(formData.entries());

    // Parse optional JSON fields safely
    let breed_colors: string[] = [];
    let recommended_feed: string | null = null;
    let description: string | null = null;

    try {
      if (rawData.breed_colors) {
        breed_colors =
          typeof rawData.breed_colors === "string"
            ? JSON.parse(rawData.breed_colors)
            : [];
      }
      if (rawData.recommended_feed) {
        recommended_feed =
          typeof rawData.recommended_feed === "string"
            ? JSON.parse(rawData.recommended_feed)
            : null;
      }
      if (rawData.description) {
        description =
          typeof rawData.description === "string"
            ? rawData.description.trim() || null
            : null;
      }
    } catch (parseError) {
      return NextResponse.json(
        { message: "Invalid JSON in breed_colors, recommended_feed, or description" },
        { status: 400 }
      );
    }

    // Required field
    const name = (rawData.name as string)?.trim();
    if (!name) {
      return NextResponse.json(
        { message: "Breed name is required" },
        { status: 400 }
      );
    }

    // Optional numeric fields (convert to number or null)
    const average_weight_kg = rawData.average_weight_kg
      ? parseFloat(rawData.average_weight_kg as string) || null
      : null;

    const maturity_age_days = rawData.maturity_age_days
      ? parseInt(rawData.maturity_age_days as string, 10) || 112
      : 112;

    // Create the breed
    const createdBreed = await Breed.create({
      name,
      description,
      average_weight_kg: average_weight_kg,
      breed_colors,
      recommended_feed,
      maturity_age_days,
    });

    return NextResponse.json(
      {
        message: "Breed created successfully",
        breed: createdBreed,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Breed creation error:", error);

    // Handle duplicate key error (unique name)
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "A breed with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        message: "Breed creation failed",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch all breeds
 */
export async function GET() {
  try {
    await connectDB();

    const breeds = await Breed.find()
      .sort({ createdAt: -1 })
      .lean(); // lean() for better performance when no modifications needed

    return NextResponse.json(
      {
        message: "Breeds fetched successfully",
        breeds,
        count: breeds.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fetch breeds error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch breeds",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}