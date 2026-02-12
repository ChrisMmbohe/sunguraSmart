import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SchedulePageClient } from "./schedule-page-client"
import { ScheduleType } from "@/database/types"

interface ScheduleItem {
  _id: string
  user_id: string
  target_date: Date
  type: ScheduleType
  description: string
  is_completed: boolean
  related_rabbit_ids: string[]
  related_entity_id: string | null
  createdAt: Date
  updatedAt: Date
}

// Mock data for demonstration - Replace with API calls
const mockSchedules: ScheduleItem[] = [
  {
    _id: "1",
    user_id: "user123",
    target_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    type: "Breeding",
    description: "Mate Buck #5 with Doe #12",
    is_completed: false,
    related_rabbit_ids: ["5", "12"],
    related_entity_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "2",
    user_id: "user123",
    target_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    type: "Palpation",
    description: "Check pregnancy status for Doe #12",
    is_completed: false,
    related_rabbit_ids: ["12"],
    related_entity_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "3",
    user_id: "user123",
    target_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    type: "Kindling",
    description: "Expected kindling date for Doe #12",
    is_completed: false,
    related_rabbit_ids: ["12"],
    related_entity_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "4",
    user_id: "user123",
    target_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    type: "Vaccination",
    description: "Vaccinate Grower rabbits - Batch #3",
    is_completed: true,
    related_rabbit_ids: ["15", "16", "17"],
    related_entity_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "5",
    user_id: "user123",
    target_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    type: "Weaning",
    description: "Wean litter from Doe #8",
    is_completed: false,
    related_rabbit_ids: ["8"],
    related_entity_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "6",
    user_id: "user123",
    target_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    type: "Admin",
    description: "Order feed supplies and bedding",
    is_completed: false,
    related_rabbit_ids: [],
    related_entity_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "7",
    user_id: "user123",
    target_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    type: "Admin",
    description: "Clean and disinfect cages",
    is_completed: false,
    related_rabbit_ids: [],
    related_entity_id: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default async function SchedulePage() {
  // In production, fetch from API:
  // const schedules = await getSchedules();
  const schedules = mockSchedules

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
          <SchedulePageClient initialSchedules={schedules} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
