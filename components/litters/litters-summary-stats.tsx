"use client";

import * as React from "react";
import { Baby, Skull, TrendingUp } from "lucide-react";
import type { LitterAnalyticsSummary, LitterTableData } from "@/app/litters/types";
import BabyRabbitIcon from "@/components/BabyRabbitIcon";
import { Tile } from "@/components/shared/tile";

interface LittersSummaryStatsProps {
  /** Currently visible (filtered/searched) rows — recomputed live via DataTable's onFilteredRowsChange. */
  filteredRows: LitterTableData[];
  /** Farm-wide, calendar-based figures that aren't derivable from the filtered set (e.g. "this month"). */
  serverSummary: LitterAnalyticsSummary;
}

/**
 * Computed entirely from whatever rows are currently visible in the table
 * (post search + facet filters), mirroring RabbitsSummaryStats — so this
 * reflects "just the weaned litters" just as accurately as "every litter".
 *
 * Uses the shared `Tile` component (same one the Rabbits page and the
 * Dashboard's KPI row use) so the card shell, icon roundel, caption
 * placement, and left accent bar are visually identical across pages —
 * no page-scoped tile styling.
 *
 * No horizontal/vertical padding here — the parent page container already
 * supplies `p-4 pt-0`, so this component owns only the grid/gap layout.
 */
export function LittersSummaryStats({ filteredRows, serverSummary }: LittersSummaryStatsProps) {
  const stats = React.useMemo(() => {
    const count = filteredRows.length;
    const totalBornAlive = filteredRows.reduce((s, r) => s + r.kitsBornAlive, 0);
    const totalMortality = filteredRows.reduce((s, r) => s + r.mortalityCount, 0);
    const activeCount = filteredRows.filter((r) => r.status === "active").length;

    const weanedRows = filteredRows.filter((r) => r.status === "weaned" && r.kitsBornAlive > 0);
    const weaningSurvivalRate =
      weanedRows.length > 0
        ? weanedRows.reduce((s, r) => s + (r.kitsWeaned ?? 0), 0) /
          weanedRows.reduce((s, r) => s + r.kitsBornAlive, 0)
        : 0;

    const avgLitterSize = count > 0 ? totalBornAlive / count : 0;

    return { count, avgLitterSize, weaningSurvivalRate, activeCount, totalMortality, totalBornAlive };
  }, [filteredRows]);

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile
        icon={BabyRabbitIcon}
        label="Shown"
        value={String(stats.count)}
        caption={`${stats.activeCount} active · avg ${stats.avgLitterSize.toFixed(1)} kits`}
        iconClassName="text-slate-600"
        valueClassName="text-slate-600"
        accentClassName="bg-slate-500"
      />
      <Tile
        icon={TrendingUp}
        label="Weaning survival"
        value={`${(stats.weaningSurvivalRate * 100).toFixed(0)}%`}
        caption="of weaned litters"
        iconClassName="text-emerald-600"
        valueClassName="text-emerald-600"
        accentClassName="bg-emerald-500"
      />
      <Tile
        icon={Skull}
        label="Mortality"
        value={String(stats.totalMortality)}
        caption={`of ${stats.totalBornAlive} born alive`}
        iconClassName="text-destructive"
        valueClassName="text-destructive"
        accentClassName="bg-destructive"
      />
      <Tile
        icon={Baby}
        label="Born this month"
        value={String(serverSummary.kitsBornThisMonth)}
        caption={`${serverSummary.totalLitters} litters all-time`}
        iconClassName="text-purple-600"
        valueClassName="text-purple-600"
        accentClassName="bg-purple-500"
      />
    </section>
  );
}
