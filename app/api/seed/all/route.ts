// app/api/seed/all/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SEED_API_SECRET = process.env.SEED_API_SECRET;
const BASE_URL = 'http://localhost:3000'; // Adjust if running in a different environment

// List of seed endpoints in sequential order
const SEED_ENDPOINTS = [
  '/api/seed/breed',
  '/api/seed/disease',
  '/api/seed/feedtype',
  '/api/seed/cage',
  '/api/seed/initial-rabbits',
  '/api/seed/simulate-breedings',
  '/api/seed/weights',
  '/api/seed/health',
  '/api/seed/terminal',
  '/api/seed/feedlogs',
  '/api/seed/expenses',
  '/api/seed/sales',
  '/api/seed/schedules',
];

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    for (const endpoint of SEED_ENDPOINTS) {
      console.log(`Seeding ${endpoint}...`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15 * 60 * 1000); // 15 minute timeout

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SEED_API_SECRET}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error seeding ${endpoint}:`, errorData);
        throw new Error(`Failed to seed ${endpoint}: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log(`Successfully seeded ${endpoint}:`, data.message);
    }

    return NextResponse.json({ message: 'All seeding completed successfully' });
  } catch (error) {
    console.error('Seeding process failed:', error);
    return NextResponse.json({ error: 'Seeding failed', details: (error as Error).message }, { status: 500 });
  }
}