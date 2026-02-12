import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { getBreedingsForTable, getRabbitsForForm, IRabbitOption } from '@/lib/data-fetcher';
import { columns } from '@/app/breeding/columns';
import { FileText } from 'lucide-react';
import { BreedingTableData } from './types';
import { BreedingPageClient } from './breeding-page-client';
import { currentUser } from '@clerk/nextjs/server';

export default async function Page() {
  let breedingsData: BreedingTableData[] = [];
  let rabbitsData: IRabbitOption[] = [];
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

    [breedingsData, rabbitsData] = await Promise.all([
      getBreedingsForTable(userId),
      getRabbitsForForm(userId),
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
          {/* Data Display */}
          {error ? (
            <div className="flex items-center justify-center rounded-lg border border-red-300 bg-red-50 p-10 text-red-700">
              <FileText className="mr-3 h-5 w-5" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <BreedingPageClient 
              initialBreedings={breedingsData} 
              initialRabbits={rabbitsData}
              columns={columns}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
