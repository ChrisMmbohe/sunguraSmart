import { Boxes, PackageX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface LowStockFeedItem {
  id: string
  name: string
  unit: string
  stockOnHand: number
  reorderThreshold: number
}

export function FeedStockCard({ items }: { items: LowStockFeedItem[] }) {
  return (
    <Card className="p-6 rounded-xl bg-muted/50 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300 border-1 h-full">
      <CardHeader>
        <CardTitle className="text-base">Feed stock</CardTitle>
        <CardDescription>Items at or below reorder threshold</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            All feed is stocked above reorder level.
          </p>
        )}

        {items.map((item) => {
          const isOut = item.stockOnHand <= 0
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
                  {isOut ? (
                    <PackageX className="h-4 w-4 text-red-600" />
                  ) : (
                    <Boxes className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.stockOnHand} / {item.reorderThreshold} {item.unit}
                  </p>
                </div>
              </div>
              <Badge variant={isOut ? "destructive" : "secondary"} className="shrink-0">
                {isOut ? "Out" : "Low"}
              </Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
