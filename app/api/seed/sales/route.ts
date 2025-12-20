// app/api/seed/sales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Sale, Rabbit } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';
const START_DATE = new Date('2024-01-01');
const END_DATE = new Date('2025-12-20');

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existing = await Sale.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Sales already seeded' });
  }

  const rabbits = await Rabbit.find({ user_id: USER_ID });

  const currentDate = new Date(START_DATE);
  while (currentDate <= END_DATE) {
    // Weekly sales
    if (currentDate.getDay() === 5) { // Friday
      // Rabbit sales
      const numRabbitSales = getRandomInt(0, 5);
      for (let i = 0; i < numRabbitSales; i++) {
        const rabbit = rabbits[getRandomInt(0, rabbits.length - 1)];
        const sale = new Sale({
          user_id: USER_ID,
          transaction_date: currentDate,
          amount_usd: getRandomFloat(20, 50),
          item_type: 'Rabbit',
          rabbit_id: rabbit._id,
          quantity_sold: 1,
        });
        await sale.save();
        rabbit.status = 'Sold';
        await rabbit.save();
      }

      // Byproduct sales
      const byproducts = ['Manure', 'Urine', 'Pelts'];
      for (const bp of byproducts) {
        if (Math.random() < 0.3) continue;
        const sale = new Sale({
          user_id: USER_ID,
          transaction_date: currentDate,
          amount_usd: getRandomFloat(10, 100),
          item_type: 'ByProduct',
          byproduct_type: bp,
          quantity_sold: getRandomInt(10, 100),
        });
        await sale.save();
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return NextResponse.json({ message: 'Sales seeded successfully' });
}