"use client"

import { Package, AlertTriangle, Wallet, ClipboardList, Gauge } from "lucide-react"
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { useCurrency } from "@/components/providers/currency-provider"
import type { FeedAnalyticsSummary } from "@/app/feeds/types"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * "Pellets g / Rabbit / Day" is the exact same metric as the dashboard's
 * own "Feed Efficiency" card (Gauge icon, amber) — same icon, same color,
 * same "30-day avg" caption. "Stock Value" reuses emerald, matching
 * "Revenue". "Low Stock" reuses amber, matching the warning tone used
 * across the dashboard. "Feed Types" / "Logs This Month" stay uncolored,
 * matching the dashboard's neutral-count style.
 */
export function FeedsSummaryStats({ analytics }: { analytics: FeedAnalyticsSummary }) {
  const { format } = useCurrency()

  const categoryChartData = analytics.consumptionByCategory.map((c) => ({
    label: `${toTitleCase(c.category)} (${c.unit})`,
    total: c.total,
  }))

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Feed Types" value={String(analytics.totalFeedTypes)} icon={Package} />
        <StatCard
          label="Low Stock"
          value={String(analytics.lowStockCount)}
          icon={AlertTriangle}
          iconClassName="text-amber-600"
          valueClassName="text-amber-600"
        />
        <StatCard
          label="Stock Value"
          value={format(analytics.totalStockValue)}
          icon={Wallet}
          iconClassName="text-emerald-600"
          valueClassName="text-emerald-600"
        />
        <StatCard label="Logs This Month" value={String(analytics.logsThisMonth)} icon={ClipboardList} />
        <StatCard
          label="Pellets g / Rabbit / Day"
          value={String(analytics.feedEfficiency.pelletsGramsPerRabbitPerDay)}
          icon={Gauge}
          iconClassName="text-amber-600"
          valueClassName="text-amber-600"
          caption="30-day avg"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pellet consumption (last 6 months, kg)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.pelletsConsumptionTrend} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={40} />
                <Tooltip formatter={(value) => `${value} kg`} />
                <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Feed spend (last 6 months)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pl-0">
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
                <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {categoryChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consumption by category (last 90 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={140} />
                <Tooltip />
                <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
