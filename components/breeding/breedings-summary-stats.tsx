"use client";

import * as React from "react";
import { CalendarClock, CheckCircle2, HeartPulse, XCircle } from "lucide-react";
import { BreedingStatus } from "@/types/enums";
import type { BreedingTableData } from "@/app/breeding/types";
import { Tile } from "@/components/shared/tile";

export function BreedingsSummaryStats({ breedings }: { breedings: BreedingTableData[] }) {
  const stats = React.useMemo(() => {
    const activeStatuses = [BreedingStatus.PAIRED, BreedingStatus.CONFIRMED_PREGNANT];
    const successfulStatuses = [BreedingStatus.KINDLED, BreedingStatus.WEANED];
    const resolvedStatuses = [...successfulStatuses, BreedingStatus.FAILED, BreedingStatus.ABORTED];
    const active = breedings.filter((breeding) => activeStatuses.includes(breeding.status)).length;
    const confirmed = breedings.filter((breeding) => breeding.status === BreedingStatus.CONFIRMED_PREGNANT).length;
    const resolved = breedings.filter((breeding) => resolvedStatuses.includes(breeding.status));
    const successful = resolved.filter((breeding) => successfulStatuses.includes(breeding.status)).length;
    const unsuccessful = resolved.filter((breeding) => [BreedingStatus.FAILED, BreedingStatus.ABORTED].includes(breeding.status));
    const dueSoon = breedings.filter((breeding) => activeStatuses.includes(breeding.status) && breeding.isOverdue);

    return {
      shown: breedings.length,
      active,
      confirmed,
      dueSoon: dueSoon.length,
      overdue: dueSoon.length,
      successRate: resolved.length > 0 ? (successful / resolved.length) * 100 : 0,
      successful,
      unsuccessful: unsuccessful.length,
    };
  }, [breedings]);

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile
        icon={HeartPulse}
        label="Shown"
        value={String(stats.shown)}
        caption={`${stats.active} active · ${stats.confirmed} pregnant`}
        iconClassName="text-slate-600"
        valueClassName="text-slate-600"
        accentClassName="bg-slate-500"
      />
      <Tile
        icon={CalendarClock}
        label="Overdue"
        value={String(stats.dueSoon)}
        caption={`${stats.overdue} overdue`}
        iconClassName="text-orange-600"
        valueClassName="text-orange-600"
        accentClassName="bg-orange-500"
      />
      <Tile
        icon={CheckCircle2}
        label="Success rate"
        value={`${stats.successRate.toFixed(0)}%`}
        caption={`${stats.successful} successful · resolved`}
        iconClassName="text-emerald-600"
        valueClassName="text-emerald-600"
        accentClassName="bg-emerald-500"
      />
      <Tile
        icon={XCircle}
        label="Unsuccessful"
        value={String(stats.unsuccessful)}
        caption="failed or aborted"
        iconClassName="text-red-600"
        valueClassName="text-red-600"
        accentClassName="bg-red-500"
      />
    </section>
  );
}