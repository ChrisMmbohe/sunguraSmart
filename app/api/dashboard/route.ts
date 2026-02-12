import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import {
  Rabbit,
  Breeding,
  Sale,
  HealthRecord,
  Litter,
} from '@/database/index';
import {
  subDays,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  format,
} from 'date-fns';
import { validateDashboardQuery, safeDashboardValidation } from '@/lib/dashboard-validation';

/**
 * Dashboard API Response Interface - Matches DashboardData in enhanced-dashboard.tsx
 */
interface DashboardData {
  stats: {
    totalRabbits: number;
    activeBreeding: number;
    recentSales: number;
    healthAlerts: number;
    rabbitDetails?: {
      does: number;
      bucks: number;
      kits: number;
    };
    breedingDetails?: {
      scheduled: number;
      inProgress: number;
    };
    salesDetails?: {
      revenue: number;
      profitMargin: number;
    };
    healthDetails?: {
      requireingAction: number;
      monitoring: number;
    };
  };
  trends: {
    rabbits: number;
    breeding: number;
    sales: number;
    health: number;
  };
  chartData: Array<{
    date: string;
    rabbits: number;
    sales: number;
    vaccinations: number;
    weights: number;
  }>;
  activities: Array<{
    id: string;
    type: 'breeding' | 'sale' | 'health' | 'litter' | 'alert' | 'milestone';
    title: string;
    description?: string;
    timestamp: string;
    status?: 'success' | 'warning' | 'alert' | 'info';
    relatedId?: string;
    relatedType?: 'rabbit' | 'litter' | 'breeding';
    metadata?: Record<string, unknown>;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    type: 'kindling' | 'weaning' | 'vaccination' | 'health' | 'breeding' | 'nest' | 'other';
    relatedId?: string;
    href?: string;
    isDismissible?: boolean;
  }>;
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'success';
    title: string;
    description: string;
    dismissible?: boolean;
  }>;
}

/**
 * GET /api/dashboard
 * Fetches aggregated dashboard data for the authenticated user
 * Query params: timeRange (default: 30d)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. AUTHENTICATION
    const { userId } = await auth();
    if (!userId) {
      console.warn('[Dashboard API] Unauthorized request - no userId');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. VALIDATE QUERY PARAMETERS
    const { searchParams } = new URL(req.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    let timeRange: number;
    
    try {
      const validatedQuery = validateDashboardQuery(queryObject);
      timeRange = parseInt(validatedQuery.timeRange);
    } catch (validationError) {
      console.warn('[Dashboard API] Query validation error:', validationError);
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationError },
        { status: 400 }
      );
    }

    // 3. DATABASE CONNECTION
    await connectDB();
    console.log(`[Dashboard API] Fetching data for userId: ${userId}, timeRange: ${timeRange}d`);

    // 4. DATE RANGES FOR QUERIES
    const now = new Date();
    const startDate = subDays(now, timeRange);
    const startDatePrevious = subDays(startDate, timeRange);

    // 5. FETCH DATA IN PARALLEL
    const [
      stats,
      trends,
      chartData,
      activities,
      tasks,
      alerts,
    ] = await Promise.all([
      computeStats(userId),
      computeTrends(userId, now, startDate, startDatePrevious),
      computeChartData(userId, timeRange),
      fetchActivities(userId),
      fetchTasks(userId),
      generateAlerts(userId),
    ]);

    const response: DashboardData = {
      stats,
      trends,
      chartData,
      activities,
      tasks,
      alerts,
    };

    // Validate response against schema
    const validationResult = safeDashboardValidation(response);
    if (!validationResult.success) {
      console.error('[Dashboard API] Response validation failed:', validationResult.error);
      return NextResponse.json(
        {
          error: 'Internal validation error',
          details: validationResult.error?.errors || [],
        },
        { status: 500 }
      );
    }

    console.log('[Dashboard API] Successfully fetched dashboard data');

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Compute dashboard statistics
 */
async function computeStats(userId: string) {
  try {
    const [
      totalRabbits,
      activeBreeding,
      recentSales,
      healthAlerts,
      does,
      bucks,
      kits,
      scheduledBreeding,
      inProgressBreeding,
      recentSalesData,
      healthAlertDetails,
    ] = await Promise.all([
      Rabbit.countDocuments({
        user_id: userId,
        status: {
          $in: ['Kit', 'Weaner', 'Grower', 'Active', 'Sick', 'Quarantined'],
        },
      }),
      Breeding.countDocuments({
        user_id: userId,
        is_successful: true,
      }),
      Sale.countDocuments({
        user_id: userId,
        transaction_date: {
          $gte: subDays(new Date(), 30),
        },
      }),
      HealthRecord.countDocuments({
        user_id: userId,
        treatment_end_date: null,
      }),
      // Detailed rabbit breakdown
      Rabbit.countDocuments({
        user_id: userId,
        status: { $in: ['Active', 'Sick', 'Quarantined'] },
        gender: 'Female',
      }),
      Rabbit.countDocuments({
        user_id: userId,
        status: { $in: ['Active', 'Sick', 'Quarantined'] },
        gender: 'Male',
      }),
      Rabbit.countDocuments({
        user_id: userId,
        status: { $in: ['Kit', 'Weaner', 'Grower'] },
      }),
      // Breeding details - Scheduled (unsuccessful breedings) vs In Progress (successful breedings waiting for/with litter)
      Breeding.countDocuments({
        user_id: userId,
        is_successful: false,
      }),
      Breeding.countDocuments({
        user_id: userId,
        is_successful: true,
      }),
      // Recent sales revenue
      Sale.aggregate([
        {
          $match: {
            user_id: userId,
            transaction_date: { $gte: subDays(new Date(), 30) },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount_usd' },
          },
        },
      ]),
      // Health alert breakdown
      HealthRecord.countDocuments({
        user_id: userId,
        treatment_end_date: null,
        severity: { $in: ['high', 'critical'] },
      }),
    ]);

    const revenue = recentSalesData[0]?.total || 0;
    const profitMargin = revenue > 0 ? 35 : 0; // Default margin, could be calculated if expense data available

    return {
      totalRabbits,
      activeBreeding,
      recentSales,
      healthAlerts,
      rabbitDetails: {
        does,
        bucks,
        kits,
      },
      breedingDetails: {
        scheduled: scheduledBreeding,
        inProgress: inProgressBreeding,
      },
      salesDetails: {
        revenue: Math.round(revenue),
        profitMargin,
      },
      healthDetails: {
        requireingAction: healthAlertDetails,
        monitoring: healthAlerts - healthAlertDetails,
      },
    };
  } catch (error) {
    console.error('[computeStats] Error:', error);
    return {
      totalRabbits: 0,
      activeBreeding: 0,
      recentSales: 0,
      healthAlerts: 0,
    };
  }
}

/**
 * Compute trend percentages by comparing current and previous periods
 */
async function computeTrends(
  userId: string,
  now: Date,
  startDate: Date,
  startDatePrevious: Date
) {
  try {
    // Current period counts
    const currentRabbits = await Rabbit.countDocuments({
      user_id: userId,
      status: {
        $in: ['Kit', 'Weaner', 'Grower', 'Active', 'Sick', 'Quarantined'],
      },
      createdAt: { $gte: startDate, $lte: now },
    });

    const currentBreeding = await Breeding.countDocuments({
      user_id: userId,
      mating_date: { $gte: startDate, $lte: now },
    });

    const currentSales = await Sale.aggregate([
      {
        $match: {
          user_id: userId,
          transaction_date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount_usd' },
        },
      },
    ]);

    const currentHealth = await HealthRecord.countDocuments({
      user_id: userId,
      date_of_diagnosis: { $gte: startDate, $lte: now },
    });

    // Previous period counts
    const prevRabbits = await Rabbit.countDocuments({
      user_id: userId,
      status: {
        $in: ['Kit', 'Weaner', 'Grower', 'Active', 'Sick', 'Quarantined'],
      },
      createdAt: { $gte: startDatePrevious, $lt: startDate },
    });

    const prevBreeding = await Breeding.countDocuments({
      user_id: userId,
      mating_date: { $gte: startDatePrevious, $lt: startDate },
    });

    const prevSales = await Sale.aggregate([
      {
        $match: {
          user_id: userId,
          transaction_date: { $gte: startDatePrevious, $lt: startDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount_usd' },
        },
      },
    ]);

    const prevHealth = await HealthRecord.countDocuments({
      user_id: userId,
      date_of_diagnosis: { $gte: startDatePrevious, $lt: startDate },
    });

    // Calculate percentage changes
    const rabbits = calculatePercentageChange(currentRabbits, prevRabbits);
    const breeding = calculatePercentageChange(currentBreeding, prevBreeding);
    const sales = calculatePercentageChange(
      currentSales[0]?.total || 0,
      prevSales[0]?.total || 0
    );
    const health = calculatePercentageChange(currentHealth, prevHealth);

    return { rabbits, breeding, sales, health };
  } catch (error) {
    console.error('[computeTrends] Error:', error);
    return { rabbits: 0, breeding: 0, sales: 0, health: 0 };
  }
}

/**
 * Generate 30-day time series chart data
 */
async function computeChartData(userId: string, days: number) {
  try {
    const now = new Date();
    const startDate = subDays(now, days);
    const dateRange = eachDayOfInterval({ start: startDate, end: now });

    // Fetch all relevant data for the period
    const [rabbits, sales, healthRecords] = await Promise.all([
      Rabbit.find({
        user_id: userId,
      }).select('timestamps createdAt'),
      Sale.find({
        user_id: userId,
        transaction_date: { $gte: startDate },
      }).select('transaction_date amount_usd'),
      HealthRecord.find({
        user_id: userId,
        date_of_diagnosis: { $gte: startDate },
      }).select('date_of_diagnosis'),
    ]);

    // Aggregate data by day
    const chartData = dateRange.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dayRabbits = rabbits.filter((r: any) => {
        const compareDate = new Date(r.createdAt || new Date());
        return compareDate >= dayStart && compareDate <= dayEnd;
      }).length;

      const daySales = sales
        .filter((s) => {
          const txDate = new Date(s.transaction_date);
          return txDate >= dayStart && txDate <= dayEnd;
        })
        .reduce((sum, s) => sum + s.amount_usd, 0);

      const dayVaccinations = healthRecords.filter((h) => {
        const diagDate = new Date(h.date_of_diagnosis);
        return diagDate >= dayStart && diagDate <= dayEnd;
      }).length;

      return {
        date: dateStr,
        rabbits: dayRabbits,
        sales: Math.round(daySales),
        vaccinations: dayVaccinations,
        weights: 0, // Weight data would come from weight.model if available
      };
    });

    return chartData;
  } catch (error) {
    console.error('[computeChartData] Error:', error);
    return [];
  }
}

/**
 * Fetch recent activities from breeding, litters, sales, and health records
 */
async function fetchActivities(userId: string) {
  try {
    const activities: DashboardData['activities'] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type DocRecord = any;

    // Recent breedings
    const breedings = await Breeding.find({ user_id: userId })
      .populate('doe_id', 'ear_tag_id name')
      .populate('buck_id', 'ear_tag_id name')
      .sort({ mating_date: -1 })
      .limit(5);

    activities.push(
      ...breedings.map((b: DocRecord) => ({
        id: b._id.toString(),
        type: 'breeding' as const,
        title: 'Breeding Recorded',
        description: `${b.doe_id?.ear_tag_id} (Doe) bred with ${b.buck_id?.ear_tag_id} (Buck)`,
        timestamp: (b.mating_date || b.createdAt || new Date()).toISOString(),
        status: b.is_successful ? ('success' as const) : ('info' as const),
        relatedId: b._id.toString(),
        relatedType: 'breeding' as const,
      }))
    );

    // Recent litters
    const litters = await Litter.find({ user_id: userId })
      .populate('doe_id', 'ear_tag_id name')
      .sort({ kindling_date: -1 })
      .limit(5);

    activities.push(
      ...litters.map((l: DocRecord) => ({
        id: l._id.toString(),
        type: 'litter' as const,
        title: 'Litter Born',
        description: `${l.doe_id?.ear_tag_id} gave birth to ${l.total_kits_born} kits (${l.kits_surviving} surviving)`,
        timestamp: (l.kindling_date || l.createdAt || new Date()).toISOString(),
        status: 'success' as const,
        relatedId: l._id.toString(),
        relatedType: 'litter' as const,
      }))
    );

    // Recent sales
    const recentSales = await Sale.find({ user_id: userId })
      .populate('rabbit_id', 'ear_tag_id name')
      .sort({ transaction_date: -1 })
      .limit(5);

    activities.push(
      ...recentSales.map((s: DocRecord) => ({
        id: s._id.toString(),
        type: 'sale' as const,
        title: 'Sale Recorded',
        description: `Sold ${s.quantity_sold} ${s.item_type}(s) for $${s.amount_usd.toFixed(2)}`,
        timestamp: s.transaction_date.toISOString(),
        status: 'success' as const,
        relatedId: s._id.toString(),
      }))
    );

    // Recent health alerts
    const healthAlerts = await HealthRecord.find({
      user_id: userId,
      treatment_end_date: null,
    })
      .populate('rabbit_id', 'ear_tag_id name')
      .sort({ date_of_diagnosis: -1 })
      .limit(5);

    activities.push(
      ...healthAlerts.map((h: DocRecord) => ({
        id: h._id.toString(),
        type: 'health' as const,
        title: 'Health Alert',
        description: `${h.rabbit_id?.ear_tag_id} - Active health issue requiring attention`,
        timestamp: h.date_of_diagnosis.toISOString(),
        status: 'alert' as const,
        relatedId: h._id.toString(),
      }))
    );

    // Sort by timestamp and return most recent 10
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);
  } catch (error) {
    console.error('[fetchActivities] Error:', error);
    return [];
  }
}

/**
 * Fetch upcoming tasks from litters (weaning) and health records (vaccinations)
 */
async function fetchTasks(userId: string) {
  try {
    const tasks: DashboardData['tasks'] = [];
    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type DocRecord = any;

    // Upcoming weaning dates
    const litterList = await Litter.find({
      user_id: userId,
      status: 'Active',
      weaning_date: null,
    }).sort({ kindling_date: 1 });

    tasks.push(
      ...litterList.map((l: DocRecord) => {
        // Calculate estimated weaning date (4-5 weeks after kindling)
        const weaningDate = new Date(l.kindling_date);
        weaningDate.setDate(weaningDate.getDate() + 28);

        return {
          id: `weaning-${l._id.toString().slice(-4)}`,
          title: `Weaning - Litter #${l._id.toString().slice(-4)}`,
          description: `Separate ${l.kits_surviving} kits from doe`,
          dueDate: weaningDate.toISOString(),
          priority: (weaningDate < now ? 'critical' : 'high') as
            | 'low'
            | 'medium'
            | 'high'
            | 'critical',
          type: 'weaning' as const,
          relatedId: l._id.toString(),
          href: '/litters',
          isDismissible: true,
        };
      })
    );

    // Upcoming vaccinations (6-week-old kits)
    const healthTasks = await HealthRecord.find({
      user_id: userId,
      treatment_end_date: null,
    })
      .populate('rabbit_id', 'ear_tag_id date_of_birth')
      .sort({ date_of_diagnosis: 1 });

    tasks.push(
      ...healthTasks
        .filter((h: DocRecord) => h.rabbit_id)
        .map((h: DocRecord) => ({
          id: `vaccination-${h._id.toString().slice(-4)}`,
          title: `Health Check - ${h.rabbit_id?.ear_tag_id}`,
          description: `Follow-up health check or vaccination required`,
          dueDate: new Date(h.treatment_start_date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'medium' as const,
          type: 'vaccination' as const,
          relatedId: h._id.toString(),
          href: '/health',
          isDismissible: true,
        }))
    );

    // Upcoming breeding windows (receptive does)
    const receptiveDoes = await Rabbit.find({
      user_id: userId,
      gender: 'Female',
      status: 'Active',
      is_pregnant: false,
    })
      .limit(5);

    tasks.push(
      ...receptiveDoes.map((rabbit: DocRecord) => ({
        id: `breeding-${rabbit._id.toString().slice(-4)}`,
        title: `Breeding Window - ${rabbit.ear_tag_id}`,
        description: `${rabbit.ear_tag_id} is receptive for breeding`,
        dueDate: new Date().toISOString(),
        priority: 'high' as const,
        type: 'breeding' as const,
        relatedId: rabbit._id.toString(),
        href: '/breeding',
        isDismissible: true,
      }))
    );

    // Sort by due date and return
    return tasks
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);
  } catch (error) {
    console.error('[fetchTasks] Error:', error);
    return [];
  }
}

/**
 * Generate dynamic alerts based on thresholds
 */
async function generateAlerts(userId: string) {
  const alerts: DashboardData['alerts'] = [];

  try {
    // Check for active health issues
    const healthAlertCount = await HealthRecord.countDocuments({
      user_id: userId,
      treatment_end_date: null,
    });

    if (healthAlertCount > 0) {
      alerts.push({
        id: 'health-alert',
        type: 'error',
        title: 'Health Alert',
        description: `${healthAlertCount} rabbit(s) showing signs of illness - immediate attention required`,
        dismissible: false,
      });
    }

    // Check for overdue tasks
    const now = new Date();
    const overdueLitters = await Litter.countDocuments({
      user_id: userId,
      status: 'Active',
      weaning_date: null,
      kindling_date: {
        $lt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
      },
    });

    if (overdueLitters > 0) {
      alerts.push({
        id: 'overdue-weaning',
        type: 'warning',
        title: 'Overdue Weaning',
        description: `${overdueLitters} litter(s) are overdue for weaning. Please review and process weaning.`,
        dismissible: true,
      });
    }

    // Check for rabbits without recent health checks
    const thirtyDaysAgo = subDays(now, 30);
    const rabbitsWithoutCheckup = await Rabbit.countDocuments({
      user_id: userId,
      status: 'Active',
      updatedAt: { $lt: thirtyDaysAgo },
    });

    if (rabbitsWithoutCheckup > 0) {
      alerts.push({
        id: 'health-checkup-needed',
        type: 'warning',
        title: 'Health Checkups Due',
        description: `${rabbitsWithoutCheckup} rabbit(s) haven't been checked in 30+ days`,
        dismissible: true,
      });
    }
  } catch (error) {
    console.error('[generateAlerts] Error:', error);
  }

  // Always include a success alert if things are running smoothly
  if (alerts.length === 0) {
    alerts.push({
      id: 'farm-status-good',
      type: 'success',
      title: 'Farm Status',
      description: 'All systems operational. Farm is healthy and on track!',
      dismissible: true,
    });
  }

  return alerts;
}

/**
 * Helper function to calculate percentage change between two values
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}
