// app/api/rabbits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import connectDB from "@/lib/mongodb";
import Rabbit from "@/database/rabbit.model";

/**
 * POST: Create a new rabbit
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const rawData = Object.fromEntries(formData.entries());

    // Required fields
    const tag_id = (rawData.tag_id as string)?.trim();
    if (!tag_id) {
      return NextResponse.json({ message: "tag_id is required" }, { status: 400 });
    }

    const gender = (rawData.gender as string)?.trim();
    if (!gender || !['Male', 'Female'].includes(gender)) {
      return NextResponse.json({ message: "gender must be 'Male' or 'Female'" }, { status: 400 });
    }

    // Optional fields
    const name = (rawData.name as string)?.trim() || null;
    const breed_id = (rawData.breed_id as string)?.trim() || null; // ObjectId string
    const date_of_birth = rawData.date_of_birth ? new Date(rawData.date_of_birth as string) : null;
    const acquisition_date = rawData.acquisition_date ? new Date(rawData.acquisition_date as string) : null;
    const acquisition_type = (rawData.acquisition_type as string)?.trim() || null;
    const source_farm = (rawData.source_farm as string)?.trim() || null;
    const cage_id = (rawData.cage_id as string)?.trim() || null; // ObjectId string
    const color = (rawData.color as string)?.trim() || null;
    const category = (rawData.category as string)?.trim() || null;
    const notes = (rawData.notes as string)?.trim() || null;
    const sire_id = (rawData.sire_id as string)?.trim() || null;
    const dam_id = (rawData.dam_id as string)?.trim() || null;
    const user_id = (rawData.user_id as string)?.trim() || null;
    const status = (rawData.status as string)?.trim() || 'Active';
    const is_pregnant = rawData.is_pregnant === 'true' ? true : false;
    const last_breeding_date = rawData.last_breeding_date ? new Date(rawData.last_breeding_date as string) : null;

    // Photo upload (optional)
    let photo: string | null = null;
    const file = formData.get('photo') as File | null;
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'RabbitPhotos' },
          (error, results) => {
            if (error) return reject(error);
            resolve(results);
          }
        ).end(buffer);
      });
      photo = (uploadResult as { secure_url: string }).secure_url;
    }

    // Create rabbit
    const createdRabbit = await Rabbit.create({
      tag_id,
      name,
      breed_id,
      gender,
      date_of_birth,
      acquisition_date,
      acquisition_type,
      source_farm,
      cage_id,
      photo,
      color,
      category,
      notes,
      sire_id,
      dam_id,
      user_id,
      status,
      is_pregnant,
      last_breeding_date,
    });

    return NextResponse.json(
      {
        message: "Rabbit created successfully",
        rabbit: createdRabbit,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Rabbit creation error:", error);

    // Handle duplicate tag_id
    if (error.code === 11000) {
      return NextResponse.json(
        { message: `Rabbit with tag_id "${error.keyValue?.tag_id}" already exists` },
        { status: 409 }
      );
    }

    // Handle validation errors from model
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Failed to create rabbit",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch all rabbits
 * Supports query params: ?user_id=123 ?status=Active ?gender=Female
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status");
    const gender = searchParams.get("gender");

    const filter: any = {};
    if (user_id) filter.user_id = user_id;
    if (status) filter.status = status;
    if (gender) filter.gender = gender;

    const rabbits = await Rabbit.find(filter)
      .populate('breed_id', 'name')  // Populate breed name
      .populate('cage_id', 'cage_id capacity')  // Populate cage details
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        message: "Rabbits fetched successfully",
        count: rabbits.length,
        rabbits,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fetch rabbits error:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch rabbits",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}