"use client"

import { Package, AlertTriangle, Wallet, Gauge } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tile } from "@/components/shared/tile"
import { CHART_COLORS } from "@/components/dashboard/dashboard-charts"
import { useCurrency } from "@/components/providers/currency-provider"
import type { FeedAnalyticsSummary } from "@/app/feeds/types"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Keep the summary focused on the four metrics that matter most for day-to-day
 * feed operations: catalogue breadth, low-stock risk, inventory value, and
 * current efficiency. The rest of the detailed charts remain below.
 */
export function FeedsSummaryStats({ analytics }: { analytics: FeedAnalyticsSummary }) {
  const { format } = useCurrency()

  const categoryChartData = analytics.consumptionByCategory.map((c) => ({
    label: `${toTitleCase(c.category)} (${c.unit})`,
    total: c.total,
  }))

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile
          icon={Package}
          label="Feed Types"
          value={String(analytics.totalFeedTypes)}
          accentClassName="bg-sky-500"
        />
        <Tile
          icon={AlertTriangle}
          label="Low Stock"
          value={String(analytics.lowStockCount)}
          iconClassName="text-amber-600"
          valueClassName="text-amber-600"
          accentClassName="bg-amber-500"
        />
        <Tile
          icon={Wallet}
          label="Stock Value"
          value={format(analytics.totalStockValue)}
          iconClassName="text-emerald-600"
          valueClassName="text-emerald-600"
          accentClassName="bg-emerald-500"
        />
        <Tile
          icon={Gauge}
          label="Pellets g / Rabbit / Day"
          value={String(analytics.feedEfficiency.pelletsGramsPerRabbitPerDay)}
          iconClassName="text-amber-600"
          valueClassName="text-amber-600"
          accentClassName="bg-amber-500"
          caption="30-day avg"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pellet consumption</CardTitle>
            <CardDescription className="text-xs">Last 6 months, monthly kilograms</CardDescription>
          </CardHeader>
          <CardContent className="h-64 px-0 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.pelletsConsumptionTrend} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={40} />
                <Tooltip formatter={(value) => `${value} kg`} />
                <Line type="monotone" dataKey="value" stroke={CHART_COLORS.expense} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Feed spend</CardTitle>
            <CardDescription className="text-xs">Last 6 months, rolling monthly spend</CardDescription>
          </CardHeader>
          <CardContent className="h-64 px-0 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.feedSpendTrend} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v: number) => format(v, { compact: true })}
                  tick={{ fontSize: 12 }}
                  width={48}
                />
                <Tooltip formatter={(value) => format(Number(value ?? 0))} />
                <Bar dataKey="value" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {categoryChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consumption by category</CardTitle>
            <CardDescription className="text-xs">Last 90 days, totals by feed category</CardDescription>
          </CardHeader>
          <CardContent className="h-64 px-0 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={140} />
                <Tooltip />
                <Bar dataKey="total" fill={CHART_COLORS.category} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
