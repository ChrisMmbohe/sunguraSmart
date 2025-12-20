// app/api/seed/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { HealthRecord, Rabbit, Disease } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existing = await HealthRecord.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Health records already seeded' });
  }

  const rabbits = await Rabbit.find({ user_id: USER_ID });
  const diseases = await Disease.find({ user_id: USER_ID });

  // Simulate health issues for ~10% of rabbits
  const numSick = Math.floor(rabbits.length * 0.1);
  const sickRabbits = rabbits.sort(() => 0.5 - Math.random()).slice(0, numSick);

  for (const rabbit of sickRabbits) {
    const disease = diseases[getRandomInt(0, diseases.length - 1)];
    const diagnosisDate = new Date(rabbit.date_of_birth);
    diagnosisDate.setDate(diagnosisDate.getDate() + getRandomInt(30, 365)); // Sometime after birth

    const treatmentStart = new Date(diagnosisDate);
    const treatmentDuration = getRandomInt(7, 30);
    const treatmentEnd = new Date(treatmentStart);
    treatmentEnd.setDate(treatmentEnd.getDate() + treatmentDuration);

    const isOngoing = Math.random() < 0.2; // 20% ongoing
    const quarantined = disease.is_quarantinable && Math.random() < 0.5;

    const healthRecord = new HealthRecord({
      user_id: USER_ID,
      rabbit_id: rabbit._id,
      disease_id: disease._id,
      date_of_diagnosis: diagnosisDate,
      treatment_start_date: treatmentStart,
      treatment_end_date: isOngoing ? null : treatmentEnd,
      quarantined,
    });
    await healthRecord.save();

    // Update rabbit status if ongoing
    if (isOngoing) {
      rabbit.status = quarantined ? 'Quarantined' : 'Sick';
      await rabbit.save();
    }
  }

  return NextResponse.json({ message: 'Health records seeded successfully' });
}