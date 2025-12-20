// app/api/seed/rabbits/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Breed from "@/database/breed.model";
import Cage from "@/database/cage.model";
import Rabbit from "@/database/rabbit.model";
import rabbitSeedData from "@/lib/seeds/rabbits"; // adjust path if needed

export async function GET() {
  try {
    await connectDB();

    const [breedDocs, cageDocs] = await Promise.all([
      Breed.find({}).lean(),
      Cage.find({}).lean(),
    ]);

    const breedMap = new Map(breedDocs.map(b => [b.name.toLowerCase(), b._id]));
    const cageMap = new Map(cageDocs.map(c => [c.cage_id, c._id]));

    // Clear previous rabbits (remove if you want idempotency)
    await Rabbit.deleteMany({});

    // Separate founders (purchased/pets) from offspring (born on farm)
    const founders = rabbitSeedData.filter(r => r.acquisition_type !== "born");
    const offspring = rabbitSeedData.filter(r => r.acquisition_type === "born");

    // Insert founders first
    const insertedFounders = await Rabbit.insertMany(
      founders.map(item => ({
        ...item,
        breed_id: breedMap.get(item.breed.toLowerCase()) ?? null,
        cage_id: item.cage_id ? cageMap.get(item.cage_id) ?? null : null,
        sire_id: null,
        dam_id: null,
        status: "Active",
        photo: null,
        user_id: null,
        is_pregnant: item.is_pregnant || false,
        last_breeding_date: item.last_breeding_date ? new Date(item.last_breeding_date) : null,
        date_of_birth: new Date(item.date_of_birth),
        acquisition_date: item.acquisition_date ? new Date(item.acquisition_date) : new Date(item.date_of_birth),
      }))
    );

    // Build tag → _id map for parent lookup
    const rabbitTagMap = new Map(insertedFounders.map(r => [r.tag_id, r._id]));

    // Insert offspring with correct parent references
    const insertedOffspring = await Rabbit.insertMany(
      offspring.map(item => ({
        ...item,
        breed_id: breedMap.get(item.breed.toLowerCase()) ?? null,
        cage_id: item.cage_id ? cageMap.get(item.cage_id) ?? null : null,
        sire_id: item.sire_tag ? rabbitTagMap.get(item.sire_tag) ?? null : null,
        dam_id: item.dam_tag ? rabbitTagMap.get(item.dam_tag) ?? null : null,
        status: "Active",
        photo: null,
        user_id: null,
        is_pregnant: false,
        last_breeding_date: null,
        date_of_birth: new Date(item.date_of_birth),
        acquisition_date: new Date(item.acquisition_date),
      }))
    );

    return NextResponse.json({
      success: true,
      message: `${insertedFounders.length + insertedOffspring.length} rabbits seeded perfectly! 🐇`,
      occupancy_example: "A01: 6/6, WEAN-01: 8/8, NEST-01: 1/1, etc.",
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Seeding failed", error: error.message },
      { status: 500 }
    );
  }
}