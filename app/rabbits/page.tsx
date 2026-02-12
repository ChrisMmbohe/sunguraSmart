import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { getRabbitsForTable, getBreedsForForm, getCagesForForm, getAvailableEarTagIds } from '@/lib/data-fetcher';
import { columns } from '@/app/rabbits/columns';
import { FileText } from 'lucide-react';
import { RabbitTableData } from '@/app/rabbits/types';
import { RabbitsPageClient } from './rabbits-page-client';
import { currentUser } from '@clerk/nextjs/server';

export default async function Page() {
  let rabbitsData: RabbitTableData[] = [];
  let breedsData: Array<{ _id: string; name: string }> = [];
  let cagesData: Array<{ _id: string; name: string; cage_type: string }> = [];
  let earTagData: Array<{ id: string; label: string }> = [];
  let error: string | null = null;

  try {
    const user = await currentUser();
    if (!user) {
      error = "User not authenticated";
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
              <div className="flex items-center justify-center rounded-lg border border-red-300 bg-red-50 p-10 text-red-700">
                <FileText className="mr-3 h-5 w-5" />
                {error}
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      );
    }

    const userId = user.id;

    [rabbitsData, breedsData, cagesData, earTagData] = await Promise.all([
      getRabbitsForTable(userId),
      getBreedsForForm(userId),
      getCagesForForm(userId),
      getAvailableEarTagIds(userId),
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
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Rabbits</p>
              <p className="text-2xl font-bold">{rabbitsData.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Active</p>
              <p className="text-2xl font-bold">{rabbitsData.filter(r => r.status === 'Active').length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Pregnant Does</p>
              <p className="text-2xl font-bold">{rabbitsData.filter(r => r.is_pregnant).length}</p>
            </div>
          </div>

          {/* Data Display */}
          {error ? (
            <div className="flex items-center justify-center rounded-lg border border-red-300 bg-red-50 p-10 text-red-700">
              <FileText className="mr-3 h-5 w-5" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <RabbitsPageClient 
              initialRabbits={rabbitsData} 
              initialBreeds={breedsData} 
              initialCages={cagesData}
              initialEarTags={earTagData}
              columns={columns}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

