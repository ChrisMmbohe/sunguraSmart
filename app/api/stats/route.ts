import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Breeding from '@/database/breeding.model';
import Litter from '@/database/litter.model';
import HealthRecord from '@/database/health-record.model';
import Rabbit from '@/database/rabbit.model';
import Sale from '@/database/sale.model';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = user.id;

    await connectDB();

    // Breeding Success Rate (using kindling_rate_pct)
    const breedingSuccess = await Breeding.getBreedingSuccess(userId);
    const breedingSuccessRate = breedingSuccess.kindling_rate_pct.toFixed(0);

    // Average Litter Size
    const averageLitterSizeResult = await Litter.aggregate([
      { $match: { user_id: userId } },
      { $group: { _id: null, avg: { $avg: '$num_kits_born' } } },
    ]);
    const averageLitterSize = averageLitterSizeResult[0]?.avg?.toFixed(1) || '0.0';

    // Health Score: (total rabbits - sick rabbits) / total rabbits * 100
    const sickCount = await HealthRecord.getSickCount(userId);
    const rabbitStats = await Rabbit.getStats(userId);
    const totalRabbits = rabbitStats.total;
    const healthScore = totalRabbits > 0 
      ? ((totalRabbits - sickCount) / totalRabbits * 100).toFixed(0) 
      : '100';

    // Revenue: Total all-time income from sales
    const start = new Date(0); // Epoch start
    const end = new Date();
    const totalRevenue = await Sale.getTotalIncome(userId, { start, end });

    return NextResponse.json({
      breedingSuccessRate: `${breedingSuccessRate}%`,
      averageLitterSize,
      healthScore: `${healthScore}%`,
      revenue: `KShs. ${totalRevenue.toLocaleString()}`,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}