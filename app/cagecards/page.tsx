import type { CSSProperties } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AlertTriangle } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { dbConnect, Cage, Rabbit, RabbitStatus, CageStatus } from "@/database"
import { CageCardsClient } from "@/components/cagecards/cage-cards-client"
import type { CageCardData, CageOccupant, CageSummary } from "./types"

async function getCageCardsData(userId: string): Promise<{ cages: CageCardData[]; summary: CageSummary }> {
  await dbConnect()

  const [cages, activeRabbitsWithCage, occupancyStats] = await Promise.all([
    Cage.find({ userId }).sort({ label: 1 }).lean<any[]>(),
    // Live occupant source of truth — deliberately not Cage.currentRabbit,
    // which can only ever name a single rabbit and can't represent a
    // multi-capacity cage's full occupant list.
    Rabbit.find({ userId, status: RabbitStatus.ACTIVE, cage: { $ne: null } })
      .populate("breed", "name")
      .select("tagNumber name gender cage breed")
      .lean<any[]>(),
    Cage.getOccupancyStats(userId),
  ])

  const occupantsByCage = new Map<string, CageOccupant[]>()
  for (const r of activeRabbitsWithCage) {
    const key = String(r.cage)
    const occupant: CageOccupant = {
      id: String(r._id),
      tagNumber: r.tagNumber,
      name: r.name,
      gender: r.gender,
      breedName: (r.breed as any)?.name ?? "Unknown",
    }
    const list = occupantsByCage.get(key) ?? []
    list.push(occupant)
    occupantsByCage.set(key, list)
  }

  const cageCards: CageCardData[] = cages.map((c) => {
    const occupants = occupantsByCage.get(String(c._id)) ?? []
    return {
      id: String(c._id),
      label: c.label,
      type: c.type,
      // Displayed status is derived from the live occupant count, not the
      // stored Cage.status field. That field is denormalized (kept in sync
      // by a Rabbit save hook) and can drift — seeded data, a save that
      // predates the sync fix, etc. — which is exactly what produced cages
      // showing "occupied" and "0/4 occupied" at once. The live count can't
      // drift, since it's computed fresh on every load, so it wins:
      //   - occupants present  -> always "occupied", regardless of what's stored
      //   - no occupants       -> use the stored status UNLESS it says
      //                           "occupied" (which would itself be stale),
      //                           falling back to "empty"
      // This preserves manually-set non-occupancy states (e.g. maintenance)
      // on empty cages, while making the occupied/empty case self-correcting.
      status:
        occupants.length > 0
          ? CageStatus.OCCUPIED
          : c.status === CageStatus.OCCUPIED
          ? CageStatus.EMPTY
          : c.status,
      capacity: c.capacity,
      location: c.location,
      notes: c.notes,
      occupants,
      occupantCount: occupants.length,
      isFull: occupants.length >= c.capacity,
      createdAt: c.createdAt?.toISOString?.() ?? String(c.createdAt),
      updatedAt: c.updatedAt?.toISOString?.() ?? String(c.updatedAt),
    }
  })

  const emptyCages = cageCards.filter((c) => c.occupantCount === 0).length

  return {
    cages: cageCards,
    summary: {
      totalCages: occupancyStats.totalCages,
      occupiedCages: occupancyStats.occupiedCages,
      emptyCages,
      totalCapacity: occupancyStats.totalCapacity,
      occupiedSlots: occupancyStats.occupiedSlots,
      availableSlots: occupancyStats.availableSlots,
      occupancyPct: occupancyStats.occupancyPct,
    },
  }
}

export default async function Page() {
  const { userId } = await auth()

  let cages: CageCardData[] = []
  let summary: CageSummary = {
    totalCages: 0,
    occupiedCages: 0,
    emptyCages: 0,
    totalCapacity: 0,
    occupiedSlots: 0,
    availableSlots: 0,
    occupancyPct: 0,
  }
  let error: string | null = null

  try {
    if (userId) {
      ;({ cages, summary } = await getCageCardsData(userId))
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
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
            <h1 className="text-2xl font-semibold tracking-tight">Cage cards</h1>
            <p className="text-sm text-muted-foreground">
              Every cage on your farm — track occupancy, assign rabbits, and print tags.
            </p>
          </div>

          {error ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-red-300 bg-red-50 p-10 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Error loading data: {error}. Check your database connection.
            </div>
          ) : (
            <CageCardsClient cages={cages} summary={summary} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
