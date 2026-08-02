"use client"

import { TrendingUp, TrendingDown, Wallet, Percent, Receipt } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueExpenseChart } from "@/components/dashboard/dashboard-charts"
import { useCurrency } from "@/components/providers/currency-provider"
import type { FinanceAnalyticsSummary } from "@/app/finances/types"

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function Tile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType
  label: string
  value: string
  tone: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold leading-tight">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FinancesSummaryStats({ analytics }: { analytics: FinanceAnalyticsSummary }) {
  const { format } = useCurrency()

  const itemTypeChartData = analytics.revenueByItemType
    .filter((r) => r.total > 0)
    .map((r) => ({ name: toTitleCase(r.itemType), value: r.total }))

  const categoryChartData = analytics.expensesByCategory
    .filter((c) => c.total > 0)
    .map((c) => ({ category: toTitleCase(c.category), total: c.total }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile
          icon={TrendingUp}
          label="Total revenue"
          value={format(analytics.totalRevenue)}
          tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <Tile
          icon={TrendingDown}
          label="Total expenses"
          value={format(analytics.totalExpenses)}
          tone="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
        />
        <Tile
          icon={Wallet}
          label="Net profit"
          value={format(analytics.netProfit)}
          tone="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
        />
        <Tile
          icon={Percent}
          label="Profit margin"
          value={`${analytics.profitMarginPct}%`}
          tone="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400"
        />
        <Tile
          icon={Receipt}
          label="Transactions this month"
          value={String(analytics.transactionCountThisMonth)}
          tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Revenue vs. expenses (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueExpenseChart data={analytics.monthlyTrend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {itemTypeChartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue by item type (trailing 12 months)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={itemTypeChartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                    {itemTypeChartData.map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => format(Number(value ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {categoryChartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expenses by category (trailing 12 months)</CardTitle>
            </CardHeader>
            <CardContent className="h-64 pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis
                    tickFormatter={(v: number) => format(v, { compact: true })}
                    tick={{ fontSize: 12 }}
                    width={48}
                  />
                  <Tooltip formatter={(value) => format(Number(value ?? 0))} />
                  <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
