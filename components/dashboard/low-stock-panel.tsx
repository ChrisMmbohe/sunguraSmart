import { Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface LowStockItem {
  id: string
  name: string
  category: string
  stockOnHand: number
  unit: string
  reorderThreshold: number
}

function toTitleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Third column of the dashboard's attention row, alongside AttentionPanel.
 * Same Card shell (padding, shadow, hover lift) so the row reads as one
 * cohesive section rather than two different card styles side by side.
 * Sourced from FeedType.lowStock(userId) — feed types already at or below
 * their configured reorder threshold — sorted most-depleted first so the
 * top of the list is always the most urgent restock.
 */
export function LowStockPanel({ items }: { items: LowStockItem[] }) {
  const sorted = [...items].sort((a, b) => a.stockOnHand - b.stockOnHand)
  const isEmpty = sorted.length === 0

  return (
    <Card className="p-6 rounded-xl bg-muted/50 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300 border-1">
      <CardHeader>
        <CardTitle className="text-base">Low feed stock</CardTitle>
        <CardDescription>Feed types at or below their reorder threshold</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {isEmpty && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            All feed types are stocked above their reorder threshold.
          </p>
        )}

        {sorted.map((item) => {
          const isOut = item.stockOnHand <= 0
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{toTitleCase(item.category)}</p>
                </div>
              </div>
              <Badge
                variant={isOut ? "destructive" : "secondary"}
                className={
                  isOut
                    ? "shrink-0"
                    : "shrink-0 border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                }
              >
                {isOut ? "Out of stock" : `${item.stockOnHand} ${item.unit} left`}
              </Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
