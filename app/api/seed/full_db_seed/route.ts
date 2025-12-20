// app/api/seed/full_db_seed/route.ts

import { NextRequest, NextResponse } from 'next/server'; // Use NextRequest and NextResponse for App Router
import { clearDatabase, setupDatabase } from '@/database/seed/seed-utils'; 

// --- Import Seed Modules (Now correctly exported from their files) ---
import { seedMetadata } from '@/database/seed/seed-metadata';
import { seedRabbits } from '@/database/seed/seed-rabbits';
import { seedLogs } from '@/database/seed/seed-logs';
import { seedHealthLifeCycle } from '@/database/seed/seed-health-life-cycle';
import { seedBreeding } from '@/database/seed/seed-breeding';
import { seedFinance } from '@/database/seed/seed-finance';
// --------------------------------------------------------

/**
 * Handles POST requests for database seeding.
 * The App Router requires named exports for HTTP methods.
 */
export async function POST(request: NextRequest) {
    // --- Security Check ---
    const SECRET_KEY = process.env.SEED_API_SECRET;
    
    // In App Router, headers are accessed via request.headers
    const providedKey = request.headers.get('x-seed-api-key') || request.nextUrl.searchParams.get('secret');

    if (!SECRET_KEY || providedKey !== SECRET_KEY) {
        console.error('SEED ATTEMPT FAILED: Invalid or missing API key.');
        return NextResponse.json(
            { success: false, message: 'Unauthorized. Invalid seed secret key.' },
            { status: 401 }
        );
    }

    try {
        console.log('--- Starting Full Database Seeding Process ---');
        
        // 1. Establish DB Connection and Initialize Models
        await setupDatabase(); 
        
        // 2. Clear Existing Seeded Data
        await clearDatabase();
       
        // 2. Sequential Execution of Seeders (Maintaining Data Integrity Order)
        
        // Step 1: Metadata (Static Dependencies)
        console.log('\n[1/6] Seeding Metadata (Breeds, Cages, Feeds, Diseases)...');
        await seedMetadata();

        // Step 2: Initial Population (Core Entities - Must include DOB for all initially created rabbits)
        console.log('\n[2/6] Seeding Initial Rabbit Population...');
        await seedRabbits();

        // Step 3: Health and Life Cycle (Adds some rabbit records)
        console.log('\n[3/6] Seeding Health Records, Cull, and Death events...');
        await seedHealthLifeCycle();
        
        // Step 4: Breeding and Lineage (CRITICAL: Creates Litters/Kits, ensuring they have date_of_birth)
        console.log('\n[4/6] Seeding Traceable Breeding Cycles and Litters...');
        await seedBreeding();

        // Step 5: Logs (Time-Series Data - MUST run AFTER all rabbit DOBs are available for age calculation)
        console.log('\n[5/6] Seeding Time-Series Logs (Feed, Weight)...');
        await seedLogs();
        
        // Step 6: Finance
        console.log('\n[6/6] Seeding Financial Records (Sales, Expenses)...');
        await seedFinance();

        console.log('\n*** ✅ Database Seeding Complete! ***');
        
        return NextResponse.json(
            { 
                success: true, 
                message: 'Database successfully seeded with realistic commercial farm data.'
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('--- ❌ Seeding Failed ---', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Database seeding failed.', 
                error: error instanceof Error ? error.message : 'An unknown error occurred.' 
            },
            { status: 500 }
        );
    }
}

/**
 * To prevent the 405 error, explicitly define other unused HTTP methods 
 * if you want to customize the allowed methods, or rely on Next.js's 
 * default behavior (which will now correctly handle the POST).
 */
// export async function GET() { 
//     return NextResponse.json({ message: 'GET not allowed for this route.' }, { status: 405 });
// }