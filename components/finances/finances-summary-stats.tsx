"use client"

import { TrendingUp, TrendingDown, Wallet, Percent, Receipt } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CHART_COLORS, RevenueExpenseChart } from "@/components/dashboard/dashboard-charts"
import { Tile } from "@/components/shared/tile"
import { useCurrency } from "@/components/providers/currency-provider"
import type { FinanceAnalyticsSummary } from "@/app/finances/types"

const PIE_CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
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
          iconClassName="text-emerald-600"
          valueClassName="text-emerald-600"
          accentClassName="bg-emerald-500"
        />
        <Tile
          icon={TrendingDown}
          label="Total expenses"
          value={format(analytics.totalExpenses)}
          iconClassName="text-red-600"
          valueClassName="text-red-600"
          accentClassName="bg-red-500"
        />
        <Tile
          icon={Wallet}
          label="Net profit"
          value={format(analytics.netProfit)}
          iconClassName="text-blue-600"
          valueClassName="text-blue-600"
          accentClassName="bg-blue-500"
        />
        <Tile
          icon={Percent}
          label="Profit margin"
          value={`${analytics.profitMarginPct}%`}
          iconClassName="text-violet-600"
          valueClassName="text-violet-600"
          accentClassName="bg-violet-500"
        />
        <Tile
          icon={Receipt}
          label="Transactions this month"
          value={String(analytics.transactionCountThisMonth)}
          iconClassName="text-amber-600"
          valueClassName="text-amber-600"
          accentClassName="bg-amber-500"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Revenue vs. expenses</CardTitle>
          <CardDescription className="text-xs">Last 6 months, monthly trend</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-4">
          <RevenueExpenseChart data={analytics.monthlyTrend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {itemTypeChartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue by item type</CardTitle>
              <CardDescription className="text-xs">Trailing 12 months</CardDescription>
            </CardHeader>
            <CardContent className="h-64 px-0 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={itemTypeChartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                    {itemTypeChartData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_CHART_COLORS[i % PIE_CHART_COLORS.length]} />
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
              <CardTitle className="text-sm font-medium">Expenses by category</CardTitle>
              <CardDescription className="text-xs">Trailing 12 months</CardDescription>
            </CardHeader>
            <CardContent className="h-64 px-0 pb-4">
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
                  <Bar dataKey="total" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
