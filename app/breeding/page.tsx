import type { CSSProperties } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AlertTriangle } from "lucide-react";
import { getBreedingOptions, getBreedingsForTable } from "@/lib/breeding-data-fetcher";
import { BreedingsClient } from "@/components/breeding/breedings-client";

export default async function BreedingPage() {
  let data: Awaited<ReturnType<typeof getBreedingsForTable>> = [];
  let options: Awaited<ReturnType<typeof getBreedingOptions>> = { does: [], bucks: [] };
  let error: string | null = null;
  try {
    [data, options] = await Promise.all([getBreedingsForTable(), getBreedingOptions()]);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  return <SidebarProvider style={{ "--sidebar-width": "calc(var(--spacing) * 60)", "--header-height": "calc(var(--spacing) * 12)" } as CSSProperties}><AppSidebar /><SidebarInset><SiteHeader /><div className="flex flex-1 flex-col gap-4 p-4 pt-0"><div><h1 className="text-2xl font-semibold tracking-tight">Breeding</h1><p className="text-sm text-muted-foreground">Record mating attempts, monitor due dates, and resolve pregnancy outcomes.</p></div>{error ? <div className="flex items-center justify-center gap-3 rounded-lg border border-red-300 bg-red-50 p-10 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400"><AlertTriangle className="h-5 w-5 shrink-0" />Error loading data: {error}. Check your database connection.</div> : <BreedingsClient initialData={data} options={options} />}</div></SidebarInset></SidebarProvider>;
}