import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { PopulationByBreedChart, RevenueExpenseChart } from "@/components/dashboard/dashboard-charts"
import { Breed, Cage, Expense, FeedType, HealthRecord, Litter, Rabbit, Sale } from "@/database"
import { auth } from "@clerk/nextjs/server"
import { dbConnect } from "@/database"
import { AlertTriangle, Baby, DollarSign, Rabbit as RabbitIcon, Warehouse, Wheat } from "lucide-react"

const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
})

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function buildTrend(
  revenue: { year: number; month: number; total: number }[],
  expenses: { year: number; month: number; total: number }[]
) {
  const revenueMap = new Map(revenue.map((item) => [`${item.year}-${item.month}`, item.total]))
  const expenseMap = new Map(expenses.map((item) => [`${item.year}-${item.month}`, item.total]))
  const cursor = new Date()
  cursor.setDate(1)

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(cursor)
    date.setMonth(cursor.getMonth() - (5 - index))
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    return {
      month: monthLabels[date.getMonth()],
      revenue: revenueMap.get(key) ?? 0,
      expenses: expenseMap.get(key) ?? 0,
    }
  })
}

interface ReportData {
  population: { total: number; active: number; byBreed: { name: string; count: number }[] }
  finance: { revenue: number; expenses: number; profit: number; margin: number; trend: { month: string; revenue: number; expenses: number }[] }
  breeding: { activeLitters: number; kitsBorn: number; averageLitter: number; survival: number }
  cages: { occupiedSlots: number; totalCapacity: number; availableSlots: number; occupancyPct: number }
  healthAlerts: number
  lowStock: { name: string; stockOnHand: number; unit: string }[]
  expenseCategories: { category: string; total: number }[]
}

const emptyReport: ReportData = {
  population: { total: 0, active: 0, byBreed: [] },
  finance: { revenue: 0, expenses: 0, profit: 0, margin: 0, trend: buildTrend([], []) },
  breeding: { activeLitters: 0, kitsBorn: 0, averageLitter: 0, survival: 0 },
  cages: { occupiedSlots: 0, totalCapacity: 0, availableSlots: 0, occupancyPct: 0 },
  healthAlerts: 0,
  lowStock: [],
  expenseCategories: [],
}

async function getReportData(userId: string): Promise<ReportData> {
  await dbConnect()
  const days30Ago = new Date(Date.now() - 30 * 86_400_000)
  const [population, breeds, finances, litterAnalytics, cages, healthAlerts, lowStock, categories, revenueTrend, expenseTrend] = await Promise.all([
    Rabbit.getPopulationStats(userId),
    Breed.find({ userId }).select("name").lean(),
    Expense.getNetProfitReport(userId),
    Litter.getLitterAnalytics(userId),
    Cage.getOccupancyStats(userId),
    HealthRecord.countDocuments({ userId, date: { $gte: days30Ago }, outcome: { $in: ["sick", "deceased"] } }),
    FeedType.lowStock(userId),
    Expense.expensesByCategory(userId),
    Sale.monthlyRevenueTrend(userId, 6),
    Expense.monthlyExpenseTrend(userId, 6),
  ])
  const breedNames = new Map(breeds.map((breed) => [String(breed._id), breed.name]))
  return {
    population: {
      total: population.total,
      active: population.byStatus.find((item) => item.status === "active")?.count ?? 0,
      byBreed: population.byBreed.map((item) => ({ name: breedNames.get(String(item.breedId)) ?? "Unknown", count: item.count })).sort((a, b) => b.count - a.count),
    },
    finance: {
      revenue: finances.totalRevenue,
      expenses: finances.totalExpenses,
      profit: finances.netProfit,
      margin: finances.profitMarginPct,
      trend: buildTrend(revenueTrend, expenseTrend),
    },
    breeding: { activeLitters: litterAnalytics.activeLitters, kitsBorn: litterAnalytics.kitsBornThisMonth, averageLitter: litterAnalytics.avgLitterSize, survival: litterAnalytics.avgWeaningSurvivalRate * 100 },
    cages,
    healthAlerts,
    lowStock: lowStock.map((item) => ({ name: item.name, stockOnHand: item.stockOnHand, unit: item.unit })),
    expenseCategories: categories.sort((a, b) => b.total - a.total).map((item) => ({ category: String(item.category).replace(/_/g, " "), total: item.total })),
  }
}

export default async function Page() {
  const { userId } = await auth()
  const report = userId ? await getReportData(userId) : emptyReport
  const occupancyLabel = `${report.cages.occupiedSlots}/${report.cages.totalCapacity}`

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
        <main className="flex flex-1 flex-col gap-6 p-4 pt-0 md:gap-8">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium text-primary">Farm intelligence</p>
              <h1 className="text-2xl font-semibold tracking-tight">Operations report</h1>
              <p className="text-sm text-muted-foreground">A current view of production, cash flow, and capacity.</p>
            </div>
            <p className="text-xs text-muted-foreground">Updated {new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(new Date())}</p>
          </div>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Active rabbits" value={String(report.population.active)} icon={RabbitIcon} iconClassName="text-slate-600" valueClassName="text-slate-600" accentClassName="bg-slate-500" caption={`${report.population.total} total tracked`} />
            <StatCard label="Net profit" value={currency.format(report.finance.profit)} icon={DollarSign} iconClassName="text-emerald-600" valueClassName={report.finance.profit >= 0 ? "text-emerald-600" : "text-red-600"} accentClassName="bg-emerald-500" caption={`${report.finance.margin.toFixed(0)}% margin`} />
            <StatCard label="Active litters" value={String(report.breeding.activeLitters)} icon={Baby} iconClassName="text-purple-600" valueClassName="text-purple-600" accentClassName="bg-purple-500" caption={`${report.breeding.kitsBorn} kits born this month`} />
            <StatCard label="Feed alerts" value={String(report.lowStock.length)} icon={Wheat} iconClassName="text-amber-600" valueClassName="text-amber-600" accentClassName="bg-amber-500" caption={report.lowStock.length ? "items need replenishing" : "Stock levels healthy"} />
            <StatCard label="Health alerts" value={String(report.healthAlerts)} icon={AlertTriangle} iconClassName="text-red-600" valueClassName="text-red-600" accentClassName="bg-red-500" caption="last 30 days" />
            <StatCard label="Cage capacity" value={occupancyLabel} icon={Warehouse} iconClassName="text-sky-600" valueClassName="text-sky-600" accentClassName="bg-sky-500" caption={`${report.cages.occupancyPct.toFixed(0)}% occupied`} />
          </section>

          <Separator />

          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Cash flow trend</CardTitle><CardDescription>Revenue and expenses across the last six months</CardDescription></CardHeader>
              <CardContent><RevenueExpenseChart data={report.finance.trend} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Rabbit population</CardTitle><CardDescription>{report.population.total} rabbits across all breeds</CardDescription></CardHeader>
              <CardContent><PopulationByBreedChart data={report.population.byBreed} /></CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Production snapshot</CardTitle><CardDescription>Breeding performance and current capacity</CardDescription></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Average litter size</p><p className="mt-1 text-2xl font-semibold">{report.breeding.averageLitter.toFixed(1)}</p><p className="text-xs text-muted-foreground">kits born alive</p></div>
                <div className="rounded-lg border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Weaning survival</p><p className="mt-1 text-2xl font-semibold">{report.breeding.survival.toFixed(0)}%</p><p className="text-xs text-muted-foreground">of recorded weaned kits</p></div>
                <div className="rounded-lg border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Available spaces</p><p className="mt-1 text-2xl font-semibold">{report.cages.availableSlots}</p><p className="text-xs text-muted-foreground">cage slots remaining</p></div>
                <div className="rounded-lg border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Gross revenue</p><p className="mt-1 text-2xl font-semibold">{currency.format(report.finance.revenue)}</p><p className="text-xs text-muted-foreground">all recorded sales</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Expense breakdown</CardTitle><CardDescription>Where recorded costs are going</CardDescription></CardHeader>
              <CardContent>
                {report.expenseCategories.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No expenses recorded yet.</p> : <div className="space-y-4">{report.expenseCategories.slice(0, 5).map((item) => <div key={item.category} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0"><span className="capitalize text-sm">{item.category}</span><span className="font-medium tabular-nums">{currency.format(item.total)}</span></div>)}</div>}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Feed inventory watch</CardTitle><CardDescription>Items at or below their reorder threshold</CardDescription></CardHeader>
              <CardContent>{report.lowStock.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">All feed inventory is above threshold.</p> : <div className="divide-y">{report.lowStock.map((item) => <div key={item.name} className="flex items-center justify-between py-3"><span className="text-sm font-medium">{item.name}</span><span className="text-sm text-amber-600">{item.stockOnHand} {item.unit} left</span></div>)}</div>}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Report notes</CardTitle><CardDescription>Useful context for the next review</CardDescription></CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground"><p>Financial totals include all recorded sales and expenses.</p><p>Health alerts count sick and deceased records from the last 30 days.</p><p>Production metrics are calculated from recorded litter and weaning data.</p></CardContent>
            </Card>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
