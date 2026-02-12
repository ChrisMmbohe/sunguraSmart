import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getLittersForTable, getBreedingsForForm } from '@/lib/data-fetcher';
import { LittersPageClient } from './litters-page-client';
import { columns } from './columns';
import { FileText } from 'lucide-react';
import { LitterTableData } from './types';
import { IBreedingOption } from '@/lib/data-fetcher';

export default async function Page() {
  let littersData: LitterTableData[] = [];
  let breedingsData: IBreedingOption[] = [];
  let error: string | null = null;

  try {
    [littersData, breedingsData] = await Promise.all([
      getLittersForTable(),
      getBreedingsForForm(),
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
            <LittersPageClient 
              initialLitters={littersData} 
              initialBreedings={breedingsData}
              columns={columns}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
