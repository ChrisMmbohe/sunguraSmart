import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  DollarSign,
  Rabbit,
  HeartPulse,
  AlertTriangle,
  Baby,
  Utensils,
  Home,
  Skull,
} from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import {
  dbConnect,
  Rabbit as RabbitModel,
  Breeding,
  Expense,
  FeedLog,
  Litter,
  Cage,
  HealthRecord,
  HealthStatus,
  HealthOutcome,
  LitterStatus,
} from "@/lib/files"

interface DashboardStats {
  population: {
    total: number
    active: number
    quarantined: number
  }
  breeding: {
    kindling_rate_pct: number
    weaning_survival_rate_pct: number
    avg_litter_size: number
    active_litters: number
    kits_born_this_month: number
  }
  financial: {
    income: number
    profit: number
  }
  health: {
    sick: number
    mortality_rate_pct: number
  }
  feed: {
    efficiency_ratio: number
  }
  cages: {
    occupancy_pct: number
    available_slots: number
  }
}

const emptyStats: DashboardStats = {
  population: { total: 0, active: 0, quarantined: 0 },
  breeding: { kindling_rate_pct: 0, weaning_survival_rate_pct: 0, avg_litter_size: 0, active_litters: 0, kits_born_this_month: 0 },
  financial: { income: 0, profit: 0 },
  health: { sick: 0, mortality_rate_pct: 0 },
  feed: { efficiency_ratio: 0 },
  cages: { occupancy_pct: 0, available_slots: 0 },
}

async function getDashboardStats(userId: string): Promise<DashboardStats> {
  await dbConnect()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const days30Ago = new Date(now.getTime() - 30 * 86_400_000)

  const [population, breedingStats, profitReport, litterMetrics, feedExpected, cageMetrics, sickCount, deaths30Days] =
    await Promise.all([
      RabbitModel.getPopulationStats(userId),
      Breeding.getBreedingSuccessRate(userId),
      Expense.getNetProfitReport(userId),
      Litter.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: null,
            avgLitterSize: { $avg: '$totalBorn' },
            avgSurvivalRate: {
              $avg: {
                $cond: [
                  { $eq: ['$totalBorn', 0] },
                  0,
                  { $divide: ['$bornAlive', '$totalBorn'] },
                ],
              },
            },
            activeLitters: {
              $sum: {
                $cond: [
                  { $in: ['$status', [LitterStatus.NURSING, LitterStatus.WEANED]] },
                  1,
                  0,
                ],
              },
            },
            kitsBornThisMonth: {
              $sum: {
                $cond: [
                  { $gte: ['$kindleDate', firstOfMonth] },
                  '$bornAlive',
                  0,
                ],
              },
            },
          },
        },
      ]),
      FeedLog.getExpectedDailyConsumption(userId),
      Cage.aggregate([
        { $match: { user_id: userId } },
        {
          $project: {
            capacity: 1,
            occupants: { $size: '$currentOccupants' },
          },
        },
        {
          $group: {
            _id: null,
            totalCapacity: { $sum: '$capacity' },
            totalOccupants: { $sum: '$occupants' },
          },
        },
      ]),
      RabbitModel.countDocuments({
        user_id: userId,
        healthStatus: { $in: [HealthStatus.SICK, HealthStatus.RECOVERING, HealthStatus.QUARANTINED] },
      }),
      HealthRecord.countDocuments({
        user_id: userId,
        outcome: HealthOutcome.DIED,
        date: { $gte: days30Ago },
      }),
    ])

  const breeding = breedingStats[0] ?? { successRate: 0 }
  const litterData = litterMetrics[0] ?? {
    avgLitterSize: 0,
    avgSurvivalRate: 0,
    activeLitters: 0,
    kitsBornThisMonth: 0,
  }
  const cageData = cageMetrics[0] ?? { totalCapacity: 0, totalOccupants: 0 }
  const occupancyPct = cageData.totalCapacity
    ? (cageData.totalOccupants / cageData.totalCapacity) * 100
    : 0

  return {
    population: {
      total: population.totalActive ?? 0,
      active: population.byStatus?.find((item: any) => item._id === 'active')?.count ?? 0,
      quarantined: population.byStatus?.find((item: any) => item._id === HealthStatus.QUARANTINED)?.count ?? 0,
    },
    breeding: {
      kindling_rate_pct: (breeding.successRate ?? 0) * 100,
      weaning_survival_rate_pct: (litterData.avgSurvivalRate ?? 0) * 100,
      avg_litter_size: litterData.avgLitterSize ?? 0,
      active_litters: litterData.activeLitters ?? 0,
      kits_born_this_month: litterData.kitsBornThisMonth ?? 0,
    },
    financial: {
      income: profitReport.totalRevenue,
      profit: profitReport.netProfit,
    },
    health: {
      sick: sickCount,
      mortality_rate_pct:
        population.totalActive > 0 ? (deaths30Days / population.totalActive) * 100 : 0,
    },
    feed: {
      efficiency_ratio: feedExpected.activeRabbitCount
        ? feedExpected.pelletsGrams / feedExpected.activeRabbitCount
        : 0,
    },
    cages: {
      occupancy_pct: occupancyPct,
      available_slots: Math.max(0, cageData.totalCapacity - cageData.totalOccupants),
    },
  }
}

export default async function Page() {
  const { userId } = await auth()
  const stats = userId ? await getDashboardStats(userId) : emptyStats

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
          <section>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                  <h3 className="tracking-tight text-sm font-medium">Total Rabbits</h3>
                  <Rabbit className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="px-6 pb-6">
                  <div className="text-3xl font-bold">{stats.population.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-600 font-medium">+{stats.population.active}</span>{" "}
                    active •{" "}
                    <span className="text-amber-600">{stats.population.quarantined}</span>{" "}
                    quarantined
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                  <h3 className="tracking-tight text-sm font-medium">Breeding Success</h3>
                  <HeartPulse className="h-5 w-5 text-pink-600" />
                </div>
                <div className="px-6 pb-6">
                  <div className="text-3xl font-bold text-pink-600">{stats.breeding.kindling_rate_pct.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-green-600">{stats.breeding.weaning_survival_rate_pct.toFixed(1)}%</span>{" "}
                    weaned • {stats.breeding.avg_litter_size.toFixed(1)} kits avg
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                  <h3 className="tracking-tight text-sm font-medium">Revenue</h3>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="px-6 pb-6">
                  <div className="text-3xl font-bold text-green-600">${stats.financial.income.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Profit:{" "}
                    <span className={`font-medium ${stats.financial.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${Math.abs(stats.financial.profit).toLocaleString()}
                    </span>
                    {stats.financial.profit >= 0 ? " ↑" : " ↓"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                  <h3 className="tracking-tight text-sm font-medium">Health Alerts</h3>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="px-6 pb-6">
                  <div className="text-3xl font-bold text-red-600">{stats.health.sick}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.health.sick === 0 ? (
                      <span className="text-green-600 font-medium">All healthy!</span>
                    ) : (
                      <>rabbits need attention</>
                    )}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                  <h3 className="tracking-tight text-sm font-medium">Active Litters</h3>
                  <Baby className="h-5 w-5 text-purple-600" />
                </div>
                <div className="px-6 pb-6">
                  <div className="text-3xl font-bold text-purple-600">{stats.breeding.active_litters}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.breeding.kits_born_this_month} born this month
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                  <h3 className="tracking-tight text-sm font-medium">Feed Efficiency</h3>
                  <Utensils className="h-5 w-5 text-amber-600" />
                </div>
                <div className="px-6 pb-6">
                  <div className="text-3xl font-bold text-amber-600">{stats.feed.efficiency_ratio.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">g pellets / rabbit / day</p>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                  <h3 className="tracking-tight text-sm font-medium">Cage Occupancy</h3>
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <div className="px-6 pb-6">
                  <div className="text-3xl font-bold text-blue-600">{stats.cages.occupancy_pct.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">{stats.cages.available_slots} slots free</p>
                </div>
              </div>

              <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                  <h3 className="tracking-tight text-sm font-medium">Mortality Rate</h3>
                  <Skull className="h-5 w-5 text-destructive" />
                </div>
                <div className="px-6 pb-6">
                  <div className="text-3xl font-bold text-destructive">{stats.health.mortality_rate_pct.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">last 30 days</p>
                </div>
              </div>
            </div>
            <div className="container mx-auto py-10">
              <Separator className="mb-6" />
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
