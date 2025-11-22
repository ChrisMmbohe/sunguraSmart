// app/api/seed/breeds/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Breed from "@/database/breed.model";
import rabbitBreeds from "@/lib/seeds/rabbit-breeds"; // adjust path as needed

export async function GET() {
  try {
    await connectDB();

    // Optional: clear existing data
    // await Breed.deleteMany({});

    const result = await Breed.insertMany(rabbitBreeds);

    return NextResponse.json(
      {
        message: `${result.length} rabbit breeds seeded successfully! `,
        count: result.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Seeding failed", error: error.message },
      { status: 500 }
    );
  }
}