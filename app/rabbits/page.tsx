import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { DataTable } from "@/components/ui/data-table"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { getRabbitsForTable } from '@/lib/data-fetcher';
import { columns } from '@/app/rabbits/columns';
import { FileText} from 'lucide-react';
import { RabbitTableData } from '@/app/rabbits/types';

export default async function Page() {

   let data: RabbitTableData[] = [];
  let error: string | null = null;

  try {
    data = await getRabbitsForTable();
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
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
           {error ? (
        <div className="flex items-center justify-center p-10 border border-red-300 bg-red-50 rounded-lg text-red-700">
          <FileText className="mr-3 h-5 w-5" />
          Error loading data: {error}. Check your database connection.
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
