// app/api/seed/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Expense } from '@/database/index';

const USER_ID = 'user_35OANY8FLr0alL39uNrIT2qD37v';
const START_DATE = new Date('2024-01-01');
const END_DATE = new Date('2025-12-20');

function getRandomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SEED_API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const existing = await Expense.countDocuments({ user_id: USER_ID });
  if (existing > 0) {
    return NextResponse.json({ message: 'Expenses already seeded' });
  }

  const currentDate = new Date(START_DATE);
  while (currentDate <= END_DATE) {
    // Monthly labor
    if (currentDate.getDate() === 1) {
      const expense = new Expense({
        user_id: USER_ID,
        transaction_date: currentDate,
        amount_usd: getRandomFloat(200, 500),
        category: 'Labor',
        description: 'Monthly farm labor costs',
      });
      await expense.save();
    }

    // Weekly feed/medical/etc
    if (currentDate.getDay() === 1) { // Monday
      const categories = ['Feed', 'Medical', 'Cages/Equipment', 'Utility', 'RabbitPurchase'];
      for (const cat of categories) {
        if (Math.random() < 0.5) continue;
        const amount = getRandomFloat(50, 200);
        const expense = new Expense({
          user_id: USER_ID,
          transaction_date: currentDate,
          amount_usd: amount,
          category: cat,
          description: `${cat} purchase`,
        });
        await expense.save();
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return NextResponse.json({ message: 'Expenses seeded successfully' });
}