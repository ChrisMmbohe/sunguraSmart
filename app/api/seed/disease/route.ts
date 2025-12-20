// app/api/seed/disease/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Disease } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existing = await Disease.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Diseases already seeded' });
  }

  const diseases = [
    {
      name: 'Pasteurellosis',
      symptoms: ['Sneezing', 'Nasal discharge', 'Abscesses'],
      treatment_protocols: 'Antibiotics like enrofloxacin, improve ventilation.',
      is_quarantinable: true,
    },
    {
      name: 'Coccidiosis',
      symptoms: ['Diarrhea', 'Weight loss', 'Lethargy'],
      treatment_protocols: 'Sulfa drugs, clean environment.',
      is_quarantinable: false,
    },
    {
      name: 'Myxomatosis',
      symptoms: ['Swollen eyes', 'Fever', 'Skin tumors'],
      treatment_protocols: 'Supportive care, vaccination prevention.',
      is_quarantinable: true,
    },
    {
      name: 'Enteritis',
      symptoms: ['Bloating', 'Diarrhea', 'Sudden death'],
      treatment_protocols: 'Fluids, probiotics, diet change.',
      is_quarantinable: false,
    },
    {
      name: 'Sore Hocks',
      symptoms: ['Ulcers on feet', 'Limping', 'Infection'],
      treatment_protocols: 'Clean wounds, softer flooring.',
      is_quarantinable: false,
    },
  ];

  for (const diseaseData of diseases) {
    const disease = new Disease({ ...diseaseData, user_id: USER_ID });
    await disease.save();
  }

  return NextResponse.json({ message: 'Diseases seeded successfully' });
}