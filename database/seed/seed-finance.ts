// src/database/seed-finance.ts

import { setupDatabase, fetchSeedIds, USER_ID, getRandomInt, daysAgo, getRandomElement, getRandomDate } from './seed-utils';
import { Sale, Expense, ISale, IExpense, Rabbit } from '@/database/index';
import { Types } from 'mongoose';

const FINANCIAL_DURATION_DAYS = 365;

// --- CORRECTED: Export the function for external API route use ---
export async function seedFinance() {
  await setupDatabase();
  const { bucks, does } = await fetchSeedIds();
  
  await Sale.deleteMany({ user_id: USER_ID });
  await Expense.deleteMany({ user_id: USER_ID });
  
  const startDate = daysAgo(FINANCIAL_DURATION_DAYS);
  const today = new Date();

  // --- 1. EXPENSES ---
  const expenses: Omit<IExpense, keyof (IExpense)[]>[] = [];
  
  const expenseCategories = ['Feed', 'Medical', 'Cages/Equipment', 'Labor', 'Utility', 'Other', 'RabbitPurchase'] as const;

  for (let i = 0; i < 100; i++) { 
    const transaction_date = getRandomDate(startDate, today);
    const category = getRandomElement(expenseCategories);
    let amount_usd = 0;
    let description = '';

    switch (category) {
        case 'Feed':
            amount_usd = getRandomInt(50, 200);
            description = `Bulk purchase of ${getRandomElement(['Pellets', 'Alfalfa Hay'])}`;
            break;
        case 'Medical':
            amount_usd = getRandomInt(20, 150);
            description = `Vet visit and medication for ${getRandomElement(['Snuffles', 'Coccidiosis'])}`;
            break;
        case 'Labor':
            amount_usd = getRandomInt(100, 500);
            description = 'Monthly labor fee/contractor payment';
            break;
        case 'RabbitPurchase':
            amount_usd = getRandomInt(50, 150) * 2; 
            description = 'Purchase of new breeding buck and doe for genetic diversity';
            break;
        default:
            amount_usd = getRandomInt(10, 80);
            description = `Misc ${category} expense.`;
    }

    expenses.push({
        transaction_date,
        amount_usd: parseFloat(amount_usd.toFixed(2)),
        category,
        description,
        notes: null
    });
  }

  await Expense.insertMany(expenses.map(e => ({ ...e, user_id: USER_ID })));
  console.log(`✅ ${expenses.length} Expenses seeded.`);


  // --- 2. SALES ---
  const sales: Omit<ISale, keyof (ISale)[]>[] = [];
  
  const allRabbits = await Rabbit.find({ user_id: USER_ID, status: 'Active' })
    .select('_id ear_tag_id name')
    .limit(10)
    .lean();
    
  for (let i = 0; i < 5; i++) { 
    const transaction_date = getRandomDate(daysAgo(90), today);
    const rabbit = allRabbits[i];
    
    if (!rabbit) continue;

    const sale: Omit<ISale, keyof (ISale)[]> = {
        transaction_date,
        amount_usd: getRandomInt(25, 100), 
        item_type: 'Rabbit',
        rabbit_id: rabbit._id as Types.ObjectId,
        byproduct_type: null,
        quantity_sold: 1,
        notes: `Sold ${rabbit.ear_tag_id} as ${i % 2 === 0 ? 'Meat' : 'Pet'}`,
    };
    sales.push(sale);
  }

  const byproducts = ['Manure', 'Urine', 'Pelts'] as const;
  for (let i = 0; i < 30; i++) { 
    const transaction_date = getRandomDate(startDate, today);
    const byproduct_type = getRandomElement(byproducts);
    let quantity_sold = 0;
    let amount_usd = 0;
    
    if (byproduct_type === 'Manure') {
        quantity_sold = getRandomInt(100, 500); 
        amount_usd = quantity_sold * 0.15; 
    } else if (byproduct_type === 'Pelts') {
        quantity_sold = getRandomInt(1, 10); 
        amount_usd = quantity_sold * 5; 
    } else {
        quantity_sold = getRandomInt(50, 150); 
        amount_usd = quantity_sold * 0.25; 
    }

    const sale: Omit<ISale, keyof (ISale)[]> = {
        transaction_date,
        amount_usd: parseFloat(amount_usd.toFixed(2)),
        item_type: 'ByProduct',
        rabbit_id: null,
        byproduct_type,
        quantity_sold,
        notes: null
    };
    sales.push(sale);
  }

  await Sale.insertMany(sales.map(s => ({ ...s, user_id: USER_ID })));
  console.log(`✅ ${sales.length} Sales seeded.`);
}