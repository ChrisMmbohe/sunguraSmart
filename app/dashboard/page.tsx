import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { RevenueExpenseChart, PopulationByBreedChart } from "@/components/dashboard/dashboard-charts"
import {
  AttentionPanel,
  type DueBreedingItem,
  type UpcomingScheduleItem,
} from "@/components/dashboard/attention-panel"
import { LowStockPanel, type LowStockItem } from "@/components/dashboard/low-stock-panel"
import { CageOccupancyCard } from "@/components/dashboard/cage-occupancy-card"
import {
  DollarSign,
  Rabbit as RabbitIcon,
  HeartPulse,
  AlertTriangle,
  Baby,
  Utensils,
  Skull,
} from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import {
  dbConnect,
  Rabbit,
  Breed,
  Breeding,
  Sale,
  Expense,
  FeedLog,
  FeedType,
  Litter,
  Cage,
  HealthRecord,
  Schedule,
  RabbitStatus,
  HealthStatus,
  HealthRecordOutcome,
} from "@/database"

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

interface DashboardStats {
  population: {
    total: number
    active: number
    quarantined: number
    byBreed: { name: string; count: number }[]
  }
  breeding: {
    kindlingRatePct: number
    weaningSurvivalRatePct: number
    avgLitterSize: number
    activeLitters: number
    kitsBornThisMonth: number
  }
  financial: {
    revenue: number
    expenses: number
    profit: number
    profitMarginPct: number
    monthlyTrend: { month: string; revenue: number; expenses: number }[]
  }
  health: {
    sick: number
    mortalityRatePct: number
  }
  feed: {
    gramsPerRabbitPerDay: number
    lowStock: LowStockItem[]
  }
  cages: {
    totalCages: number
    occupiedCages: number
    totalCapacity: number
    occupiedSlots: number
    occupancyPct: number
    availableSlots: number
  }
  attention: {
    dueBreedings: DueBreedingItem[]
    upcomingSchedule: UpcomingScheduleItem[]
  }
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** Builds a fixed 6-month x-axis and fills in revenue/expense totals wherever we have them. */
function buildMonthlyTrend(
  revenue: { year: number; month: number; total: number }[],
  expenses: { year: number; month: number; total: number }[],
  months = 6
) {
  const revenueMap = new Map(revenue.map((r) => [`${r.year}-${r.month}`, r.total]))
  const expenseMap = new Map(expenses.map((e) => [`${e.year}-${e.month}`, e.total]))

  const points: { month: string; revenue: number; expenses: number }[] = []
  const cursor = new Date()
  cursor.setDate(1)

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(cursor)
    d.setMonth(cursor.getMonth() - i)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    points.push({
      month: MONTH_LABELS[d.getMonth()],
      revenue: revenueMap.get(key) ?? 0,
      expenses: expenseMap.get(key) ?? 0,
    })
  }

  return points
}

const emptyStats: DashboardStats = {
  population: { total: 0, active: 0, quarantined: 0, byBreed: [] },
  breeding: { kindlingRatePct: 0, weaningSurvivalRatePct: 0, avgLitterSize: 0, activeLitters: 0, kitsBornThisMonth: 0 },
  financial: { revenue: 0, expenses: 0, profit: 0, profitMarginPct: 0, monthlyTrend: buildMonthlyTrend([], []) },
  health: { sick: 0, mortalityRatePct: 0 },
  feed: { gramsPerRabbitPerDay: 0, lowStock: [] },
  cages: { totalCages: 0, occupiedCages: 0, totalCapacity: 0, occupiedSlots: 0, occupancyPct: 0, availableSlots: 0 },
  attention: { dueBreedings: [], upcomingSchedule: [] },
}

async function getDashboardStats(userId: string): Promise<DashboardStats> {
  await dbConnect()

  const days30Ago = new Date(Date.now() - 30 * 86_400_000)

  const [
    population,
    breeds,
    breedingSuccess,
    profitReport,
    litterAnalytics,
    feedEfficiency,
    lowStockFeedTypes,
    cageStats,
    sickCount,
    deaths30Days,
    revTrend,
    expTrend,
    dueBreedings,
    upcomingSchedule,
  ] = await Promise.all([
    Rabbit.getPopulationStats(userId),
    Breed.find({ userId }).select("name").lean(),
    Breeding.getBreedingSuccessRate(userId),
    Expense.getNetProfitReport(userId),
    Litter.getLitterAnalytics(userId),
    FeedLog.getFeedEfficiency(userId),
    FeedType.lowStock(userId),
    Cage.getOccupancyStats(userId),
    Rabbit.countDocuments({
      userId,
      healthStatus: { $in: [HealthStatus.SICK, HealthStatus.RECOVERING, HealthStatus.QUARANTINED] },
    }),
    HealthRecord.countDocuments({
      userId,
      outcome: HealthRecordOutcome.DECEASED,
      date: { $gte: days30Ago },
    }),
    Sale.monthlyRevenueTrend(userId, 6),
    Expense.monthlyExpenseTrend(userId, 6),
    Breeding.findDueSoon(userId, 5).populate("doe buck", "name tagNumber"),
    Schedule.findUpcoming(userId, 7).populate("rabbit", "name tagNumber"),
  ])

  const breedNameById = new Map(breeds.map((b) => [String(b._id), b.name]))
  const byBreed = population.byBreed
    .map((b) => ({ name: breedNameById.get(String(b.breedId)) ?? "Unknown", count: b.count }))
    .sort((a, b) => b.count - a.count)

  const active = population.byStatus.find((s) => s.status === RabbitStatus.ACTIVE)?.count ?? 0
  const quarantined = population.byHealthStatus.find((h) => h.healthStatus === HealthStatus.QUARANTINED)?.count ?? 0

  const now = Date.now()

  return {
    population: { total: population.total, active, quarantined, byBreed },
    breeding: {
      kindlingRatePct: breedingSuccess.successRate * 100,
      weaningSurvivalRatePct: litterAnalytics.avgWeaningSurvivalRate * 100,
      avgLitterSize: litterAnalytics.avgLitterSize,
      activeLitters: litterAnalytics.activeLitters,
      kitsBornThisMonth: litterAnalytics.kitsBornThisMonth,
    },
    financial: {
      revenue: profitReport.totalRevenue,
      expenses: profitReport.totalExpenses,
      profit: profitReport.netProfit,
      profitMarginPct: profitReport.profitMarginPct,
      monthlyTrend: buildMonthlyTrend(revTrend, expTrend),
    },
    health: {
      sick: sickCount,
      mortalityRatePct: population.total > 0 ? (deaths30Days / population.total) * 100 : 0,
    },
    feed: {
      gramsPerRabbitPerDay: feedEfficiency.pelletsGramsPerRabbitPerDay,
      lowStock: lowStockFeedTypes.map((f: any) => ({
        id: String(f._id),
        name: f.name,
        category: f.category,
        stockOnHand: f.stockOnHand,
        unit: f.unit,
        reorderThreshold: f.reorderThreshold,
      })),
    },
    cages: cageStats,
    attention: {
      dueBreedings: dueBreedings.map((b: any) => ({
        id: String(b._id),
        doeName: b.doe?.name ?? b.doe?.tagNumber ?? "Doe",
        buckName: b.buck?.name ?? b.buck?.tagNumber ?? "Buck",
        expectedDueDate: b.expectedDueDate,
        isOverdue: b.expectedDueDate.getTime() < now,
      })),
      upcomingSchedule: upcomingSchedule.map((s: any) => ({
        id: String(s._id),
        title: s.title,
        type: s.type,
        dueDate: s.dueDate,
        rabbitName: s.rabbit?.name ?? s.rabbit?.tagNumber,
        isOverdue: s.dueDate.getTime() < now,
      })),
    },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const kes = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })

export default async function Page() {
  const { userId } = await auth()
  const stats = userId ? await getDashboardStats(userId) : emptyStats

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0 md:gap-8">
          {/* KPI row — each tile renders through the shared Tile shell (see
              components/shared/tile.tsx), the same one used on the Rabbits
              page: neutral icon roundel, label-over-caption layout, and a
              colored accent bar on the left edge carrying the metric's
              color instead of tinting the icon circle itself. Unlike the
              Rabbits tiles, captions here can carry their own colored
              segments and wrap onto a second line where useful. */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            <StatCard
              label="Total Rabbits"
              value={stats.population.total.toLocaleString()}
              icon={RabbitIcon}
              iconClassName="text-slate-600"
              valueClassName="text-slate-600"
              accentClassName="bg-slate-500"
              caption={
                <>
                  <span className="font-medium text-emerald-600">{stats.population.active} active</span>
                  {stats.population.quarantined > 0 && (
                    <>
                      {" · "}
                      <span className="text-amber-600">{stats.population.quarantined} quarantined</span>
                    </>
                  )}
                </>
              }
            />
            <StatCard
              label="Breeding Success"
              value={`${stats.breeding.kindlingRatePct.toFixed(0)}%`}
              icon={HeartPulse}
              iconClassName="text-pink-600"
              valueClassName="text-pink-600"
              accentClassName="bg-pink-500"
              caption={
                <>
                  {stats.breeding.weaningSurvivalRatePct.toFixed(0)}% weaning survival ·{" "}
                  {stats.breeding.avgLitterSize.toFixed(1)} kits avg
                </>
              }
            />
            <StatCard
              label="Revenue"
              value={kes.format(stats.financial.revenue)}
              icon={DollarSign}
              iconClassName="text-emerald-600"
              valueClassName="text-emerald-600"
              accentClassName="bg-emerald-500"
              caption={
                <>
                  Profit:{" "}
                  <span className={stats.financial.profit >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
                    {kes.format(Math.abs(stats.financial.profit))}
                  </span>{" "}
                  ({stats.financial.profitMarginPct.toFixed(0)}% margin)
                </>
              }
            />
            <StatCard
              label="Health Alerts"
              value={String(stats.health.sick)}
              icon={AlertTriangle}
              iconClassName="text-red-600"
              valueClassName="text-red-600"
              accentClassName="bg-red-500"
              caption={stats.health.sick === 0 ? "All rabbits healthy" : "rabbits need attention"}
            />
            <StatCard
              label="Active Litters"
              value={String(stats.breeding.activeLitters)}
              icon={Baby}
              iconClassName="text-purple-600"
              valueClassName="text-purple-600"
              accentClassName="bg-purple-500"
              caption={`${stats.breeding.kitsBornThisMonth} kits born this month`}
            />
            <StatCard
              label="Feed Efficiency"
              value={stats.feed.gramsPerRabbitPerDay.toFixed(0)}
              icon={Utensils}
              iconClassName="text-amber-600"
              valueClassName="text-amber-600"
              accentClassName="bg-amber-500"
              caption="g pellets / rabbit / day (30-day avg)"
            />
            <StatCard
              label="Mortality Rate"
              value={`${stats.health.mortalityRatePct.toFixed(1)}%`}
              icon={Skull}
              iconClassName="text-destructive"
              valueClassName="text-destructive"
              accentClassName="bg-destructive"
              caption="trailing 30 days"
            />
            <CageOccupancyCard {...stats.cages} />
          </section>

          <Separator />

          {/* Analytics row */}
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Revenue vs. expenses</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueExpenseChart data={stats.financial.monthlyTrend} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Population by breed</CardTitle>
                <CardDescription>{stats.population.total} active rabbits</CardDescription>
              </CardHeader>
              <CardContent>
                <PopulationByBreedChart data={stats.population.byBreed} />
              </CardContent>
            </Card>
          </section>

          {/* Attention row — AttentionPanel (breedings due + upcoming
              schedule) takes the first two columns; LowStockPanel fills
              the third, using the same Card shell so the row reads as one
              cohesive section rather than a 2-up row with dead space. */}
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AttentionPanel
                dueBreedings={stats.attention.dueBreedings}
                upcomingSchedule={stats.attention.upcomingSchedule}
              />
            </div>
            <LowStockPanel items={stats.feed.lowStock} />
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
