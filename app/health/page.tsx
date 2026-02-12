import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { DataTable } from "@/components/ui/data-table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getHealthRecordsForTable, getRabbitsForForm, getDiseasesForForm, getHealthStats } from '@/lib/data-fetcher';
import { columns } from '@/app/health/columns';
import { FileText } from 'lucide-react';
import { HealthRecordTableData } from '@/app/health/types';
import { HealthPageClient } from './health-page-client';

export default async function Page() {
  let recordsData: HealthRecordTableData[] = [];
  let rabbitsData = [];
  let diseasesData = [];
  let healthStats = { total_sick: 0, quarantined: 0, active_records: 0 };
  let error: string | null = null;

  try {
    [recordsData, rabbitsData, diseasesData, healthStats] = await Promise.all([
      getHealthRecordsForTable(),
      getRabbitsForForm(),
      getDiseasesForForm(),
      getHealthStats(),
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
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Summary Cards */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Sick Rabbits</p>
              <p className="text-2xl font-bold text-red-600">{healthStats.total_sick}</p>
              <p className="text-xs text-muted-foreground mt-1">Active health records</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Quarantined</p>
              <p className="text-2xl font-bold text-amber-600">{healthStats.quarantined}</p>
              <p className="text-xs text-muted-foreground mt-1">Currently isolated</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Records</p>
              <p className="text-2xl font-bold">{recordsData.length}</p>
              <p className="text-xs text-muted-foreground mt-1">All health events</p>
            </div>
          </div>

          {/* Data Display */}
          {error ? (
            <div className="flex items-center justify-center rounded-lg border border-red-300 bg-red-50 p-10 text-red-700">
              <FileText className="mr-3 h-5 w-5" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <HealthPageClient 
              initialRecords={recordsData}
              rabbits={rabbitsData}
              diseases={diseasesData}
              columns={columns}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
