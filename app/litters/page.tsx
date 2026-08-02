import type { CSSProperties } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AlertTriangle } from "lucide-react";

import {
  getLittersForTable,
  getBreedingsAvailableForLitter,
  getLitterAnalyticsSummary,
} from "@/lib/litters-data-fetcher";
import { LittersClient } from "@/components/litters/litters-client";
import type { BreedingOption, LitterAnalyticsSummary, LitterTableData } from "./types";

export default async function LittersPage() {
  let data: LitterTableData[] = [];
  let breedingOptions: BreedingOption[] = [];
  let analyticsSummary: LitterAnalyticsSummary = {
    totalLitters: 0,
    activeLitters: 0,
    weanedLitters: 0,
    avgLitterSize: 0,
    avgWeaningSurvivalRate: 0,
    kitsBornThisMonth: 0,
    totalKitsBornAlive: 0,
    totalKitsBornDead: 0,
    totalMortality: 0,
    totalWeaned: 0,
    stillbirthRatePct: 0,
  };
  let error: string | null = null;

  try {
    ;[data, breedingOptions, analyticsSummary] = await Promise.all([
      getLittersForTable(),
      getBreedingsAvailableForLitter(),
      getLitterAnalyticsSummary(),
    ]);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Litters</h1>
            <p className="text-sm text-muted-foreground">
              Track kindlings, mortality, and weaning across every breeding pair on the farm.
            </p>
          </div>

          {error ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-red-300 bg-red-50 p-10 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <LittersClient initialData={data} breedingOptions={breedingOptions} analyticsSummary={analyticsSummary} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
