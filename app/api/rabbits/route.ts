// app/api/rabbits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { auth } from "@clerk/nextjs/server"; // <-- New Clerk import
import connectDB from "@/lib/mongodb";
import Rabbit from "@/database/rabbit.model";

/**
 * POST: Create a new rabbit
 */
export async function POST(req: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK
    // ✅ FIX: auth() must be awaited
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Authorization: Ensure the user_id field in the request matches the authenticated userId
    // This is a basic authorization check to prevent users from creating rabbits for other user accounts.
    const formData = await req.formData();
    const rawData = Object.fromEntries(formData.entries());
    const request_user_id = (rawData.user_id as string)?.trim() || null;

    if (request_user_id && request_user_id !== userId) {
      // Log this attempt for security monitoring
      console.error(`Authorization failed: Authenticated userId ${userId} tried to create rabbit for user_id ${request_user_id}`);
      return NextResponse.json({ error: "Forbidden: Cannot create records for a different user" }, { status: 403 });
    }
    
    await connectDB();

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
    
    // Date Validation
    const date_of_birth = rawData.date_of_birth ? (() => {
      const date = new Date(rawData.date_of_birth as string);
      return isNaN(date.getTime()) ? null : date;
    })() : null;

    const acquisition_date = rawData.acquisition_date ? (() => {
      const date = new Date(rawData.acquisition_date as string);
      return isNaN(date.getTime()) ? null : date;
    })() : null;
    
    const last_breeding_date = rawData.last_breeding_date ? (() => {
      const date = new Date(rawData.last_breeding_date as string);
      return isNaN(date.getTime()) ? null : date;
    })() : null;
    // End Date Validation

    const acquisition_type = (rawData.acquisition_type as string)?.trim() || null;
    const source_farm = (rawData.source_farm as string)?.trim() || null;
    const cage_id = (rawData.cage_id as string)?.trim() || null; // ObjectId string
    const color = (rawData.color as string)?.trim() || null;
    const category = (rawData.category as string)?.trim() || null;
    const notes = (rawData.notes as string)?.trim() || null;
    const sire_id = (rawData.sire_id as string)?.trim() || null;
    const dam_id = (rawData.dam_id as string)?.trim() || null;
    
    // CRITICAL: Use the authenticated userId for the record, overwriting any potentially malicious request value
    const final_user_id = userId; 

    const status = (rawData.status as string)?.trim() || 'Active';
    const is_pregnant = rawData.is_pregnant === 'true' ? true : false;
    

    // Photo upload (optional)
    let photo: string | null = null;
    const file = formData.get('photo') as File | null;
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { message: "Only image files (JPEG, PNG, WebP, GIF) are allowed" },
          { status: 400 }
        );
      }

      // Validate file size (e.g., 5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { message: "File size must not exceed 5MB" },
          { status: 400 }
        );
      }
      
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
      
      // Validate uploadResult before accessing secure_url
      if (uploadResult && typeof uploadResult === 'object' && 'secure_url' in uploadResult) {
        photo = (uploadResult as { secure_url: string }).secure_url;
      } else {
        // Handle case where Cloudinary returns a non-standard or missing URL result
        console.error("Cloudinary upload failed to return a secure_url:", uploadResult);
        return NextResponse.json(
          { message: "Failed to process image upload after successful transfer" },
          { status: 500 }
        );
      }
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
      // IMPORTANT: Use the authenticated userId
      user_id: final_user_id, 
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
 * Supports query params: ?user_id=123 ?status=Active ?gender=Female ?page=1 ?limit=50
 */
export async function GET(req: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK
    // ✅ FIX: auth() must be awaited
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const gender = searchParams.get("gender");
    
    // Note: The user_id is now *always* filtered by the authenticated user's ID for security
    // We will ignore any user_id query param passed by the client to prevent access to other users' data.
    const filter_user_id = userId; 

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    filter.user_id = filter_user_id; // CRITICAL: Only fetch rabbits for the authenticated user
    if (status) filter.status = status;
    if (gender) filter.gender = gender;

    // Fetch rabbits and total count concurrently
    const [rabbits, total] = await Promise.all([
      Rabbit.find(filter)
        .populate('breed_id', 'name')  // Populate breed name
        .populate('cage_id', 'cage_id capacity')  // Populate cage details
        .sort({ createdAt: -1 })
        .skip(skip) // Apply skip for pagination
        .limit(limit) // Apply limit for pagination
        .lean(),
      Rabbit.countDocuments(filter) // Get total count for pagination metadata
    ]);

    return NextResponse.json(
      {
        message: "Rabbits fetched successfully",
        count: rabbits.length, // Number of rabbits returned on this page
        total, // Total number of rabbits matching the filter
        page, // Current page number
        totalPages: Math.ceil(total / limit), // Total number of pages
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