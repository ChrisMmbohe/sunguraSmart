import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SchedulePageClient } from "./schedule-page-client"
import { ScheduleType } from "@/database/types"
import { getSchedulesForTable } from '@/lib/data-fetcher'
import { currentUser } from '@clerk/nextjs/server'
import { FileText } from 'lucide-react'

interface ScheduleItem {
  _id: string
  target_date: Date
  type: ScheduleType
  description: string
  is_completed: boolean
  related_rabbit_ids: Array<{ _id: string; ear_tag_id: string; name: string }>
  related_entity_id: string | null
  createdAt: Date
}

// Mock data for demonstration - Replace with API calls
const mockSchedules: ScheduleItem[] = [
  {
    _id: "1",
    target_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    type: "Breeding",
    description: "Mate Buck #5 with Doe #12",
    is_completed: false,
    related_rabbit_ids: [],
    related_entity_id: null,
    createdAt: new Date(),
  },
  {
    _id: "2",
    target_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    type: "Palpation",
    description: "Check pregnancy status for Doe #12",
    is_completed: false,
    related_rabbit_ids: [],
    related_entity_id: null,
    createdAt: new Date(),
  },
  {
    _id: "3",
    target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    type: "Kindling",
    description: "Expected kindling date for Doe #12",
    is_completed: false,
    related_rabbit_ids: [],
    related_entity_id: null,
    createdAt: new Date(),
  },
  {
    _id: "4",
    target_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    type: "Vaccination",
    description: "Vaccinate Grower rabbits - Batch #3",
    is_completed: true,
    related_rabbit_ids: [],
    related_entity_id: null,
    createdAt: new Date(),
  },
  {
    _id: "5",
    target_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    type: "Weaning",
    description: "Wean litter from Doe #8",
    is_completed: false,
    related_rabbit_ids: [],
    related_entity_id: null,
    createdAt: new Date(),
  },
  {
    _id: "6",
    target_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    type: "Admin",
    description: "Order feed supplies and bedding",
    is_completed: false,
    related_rabbit_ids: [],
    related_entity_id: null,
    createdAt: new Date(),
  },
  {
    _id: "7",
    target_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    type: "Admin",
    description: "Clean and disinfect cages",
    is_completed: false,
    related_rabbit_ids: [],
    related_entity_id: null,
    createdAt: new Date(),
  },
]

export default async function SchedulePage() {
  let schedules: ScheduleItem[] = [];
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

    // Fetch real data from database, filtered by user
    schedules = await getSchedulesForTable(userId);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    // Fallback to mock data if fetch fails
    schedules = mockSchedules;
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
          {error ? (
            <div className="flex items-center justify-center rounded-lg border border-red-300 bg-red-50 p-10 text-red-700">
              <FileText className="mr-3 h-5 w-5" />
              Error loading data: {error}
            </div>
          ) : (
            <SchedulePageClient initialSchedules={schedules} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
