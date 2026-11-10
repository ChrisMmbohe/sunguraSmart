"use client"

import type { ElementType } from "react"
import {
  AlertTriangle,
  Stethoscope,
  ShieldAlert,
  Wallet,
  Syringe,
  Scissors,
  Pill,
  HeartPulse,
  Sparkles,
} from "lucide-react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tile } from "@/components/shared/tile"
import { CHART_COLORS } from "@/components/dashboard/dashboard-charts"
import type { HealthAnalyticsSummary } from "@/app/health/types"

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

const OUTCOME_COLORS: Record<string, string> = {
  ongoing: CHART_COLORS.warning,
  recovered: CHART_COLORS.success,
  deceased: CHART_COLORS.neutral,
  chronic: CHART_COLORS.expense,
}

// Keyword lookup so each record type gets a distinct, semantically-relevant icon
// without needing the raw enum values wired in explicitly.
const TYPE_ICON_KEYWORDS: [string, ElementType][] = [
  ["vaccin", Syringe],
  ["quarantine", ShieldAlert],
  ["injury", Scissors],
  ["wound", Scissors],
  ["treatment", Pill],
  ["medic", Pill],
  ["deworm", Pill],
  ["checkup", HeartPulse],
  ["illness", Stethoscope],
  ["sick", Stethoscope],
]

function iconForType(type: string): ElementType {
  const key = type.toLowerCase()
  const match = TYPE_ICON_KEYWORDS.find(([keyword]) => key.includes(keyword))
  return match ? match[1] : Sparkles
}

// Short, plain-language context for what a record type actually covers —
// shown on hover so the bar isn't just a bare number.
const TYPE_DESCRIPTIONS: [string, string][] = [
  ["vaccin", "Routine immunizations and booster shots to keep the herd protected."],
  ["quarantine", "Isolation periods logged to contain a suspected or confirmed illness."],
  ["injury", "Cuts, fractures, or physical trauma requiring treatment."],
  ["wound", "Cuts, fractures, or physical trauma requiring treatment."],
  ["treatment", "Active treatment courses for a diagnosed condition."],
  ["medic", "Active treatment courses for a diagnosed condition."],
  ["deworm", "Scheduled parasite prevention and deworming doses."],
  ["checkup", "Routine wellness checks with no specific complaint."],
  ["illness", "Sickness cases being monitored or treated."],
  ["sick", "Sickness cases being monitored or treated."],
]

function descriptionForType(type: string): string {
  const key = type.toLowerCase()
  const match = TYPE_DESCRIPTIONS.find(([keyword]) => key.includes(keyword))
  return match ? match[1] : "Health records logged under this category."
}

export function HealthSummaryStats({ analytics }: { analytics: HealthAnalyticsSummary }) {
  const typeChartData = analytics.byType
    .filter((t) => t.count > 0)
    .map((t) => ({ type: toTitleCase(t.type), count: t.count }))
    .sort((a, b) => b.count - a.count)

  const maxTypeCount = typeChartData.length > 0 ? Math.max(...typeChartData.map((t) => t.count)) : 0
  const totalTypeCount = typeChartData.reduce((sum, t) => sum + t.count, 0)

  const outcomeChartData = analytics.outcomeBreakdown
    .filter((o) => o.count > 0)
    .map((o) => ({ name: toTitleCase(o.outcome), value: o.count, key: o.outcome }))

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid gap-4">
        {/* Mirrors the Schedule page's summary row: shared Tile component
            (icon roundel + colored left accent bar) instead of the
            Card+Tooltip cards this section used before. */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile
            icon={Stethoscope}
            label="Currently sick"
            value={String(analytics.currentlySick)}
            iconClassName="text-red-600"
            valueClassName="text-red-600"
            accentClassName="bg-red-500"
            caption={
              analytics.currentlyRecovering > 0
                ? `${analytics.currentlyRecovering} recovering`
                : undefined
            }
          />
          <Tile
            icon={ShieldAlert}
            label="Quarantined"
            value={String(analytics.currentlyQuarantined)}
            iconClassName="text-orange-600"
            valueClassName="text-orange-600"
            accentClassName="bg-orange-500"
          />
          <Tile
            icon={AlertTriangle}
            label="Overdue follow-ups"
            value={String(analytics.overdueFollowUps)}
            iconClassName="text-amber-600"
            valueClassName="text-amber-600"
            accentClassName="bg-amber-500"
            caption={
              analytics.overdueFollowUps === 0
                ? "Nothing overdue"
                : analytics.dueThisWeekFollowUps > 0
                ? `${analytics.dueThisWeekFollowUps} more due this week`
                : undefined
            }
          />
          <Tile
            icon={Wallet}
            label="Vet cost this month"
            value={analytics.costThisMonth.toLocaleString()}
            iconClassName="text-violet-600"
            valueClassName="text-violet-600"
            accentClassName="bg-violet-500"
            caption={`${analytics.recordsThisMonth} record${analytics.recordsThisMonth === 1 ? "" : "s"}`}
          />
        </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {typeChartData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Records by type</CardTitle>
              <CardDescription className="text-xs">Trailing 12 months, ranked by volume</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 pb-4">
              {typeChartData.map((t) => {
                const Icon = iconForType(t.type)
                const barPct = maxTypeCount > 0 ? Math.round((t.count / maxTypeCount) * 100) : 0
                const share = totalTypeCount > 0 ? Math.round((t.count / totalTypeCount) * 100) : 0
                return (
                  <Tooltip key={t.type}>
                    <TooltipTrigger asChild>
                      <div className="flex cursor-default items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-baseline justify-between gap-2">
                            <span className="truncate text-sm font-medium">{t.type}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {t.count} · {share}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64 text-xs">
                      <span className="font-medium">
                        {t.type}: {t.count} record{t.count === 1 ? "" : "s"} ({share}% of all types)
                      </span>
                      <br />
                      {descriptionForType(t.type)}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </CardContent>
          </Card>
        )}

        {outcomeChartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Outcomes (trailing 12 months)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={outcomeChartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                    {outcomeChartData.map((entry) => (
                      <Cell key={entry.key} fill={OUTCOME_COLORS[entry.key] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {analytics.topDiseases.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most common diagnoses</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pb-4">
            {analytics.topDiseases.map((d) => (
              <Badge key={d.diseaseId} variant="secondary" className="gap-1.5 text-xs">
                {d.name}
                {d.isContagious && <AlertTriangle className="h-3 w-3 text-red-500" />}
                <span className="text-muted-foreground">×{d.count}</span>
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  )
}
