import { cn } from "@/lib/utils"

/**
 * The signature visual for the marketing homepage.
 *
 * SunguraSmart's whole data model hangs off one physical artifact: the
 * ear-tag number stamped on every rabbit (see Rabbit.tagNumber). Instead of
 * a generic "dashboard screenshot" hero, this renders that artifact
 * directly — a punch-card-style record with a notch and stitched border,
 * showing the kind of entry a farmer would actually see after logging a
 * weigh-in. Built entirely from theme tokens so it matches light/dark mode
 * automatically.
 */
export function FarmRecordCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-full max-w-sm rotate-[-2deg] rounded-2xl border border-dashed border-border bg-card p-6 shadow-xl shadow-black/10",
        className
      )}
    >
      {/* corner punch hole */}
      <div className="absolute -left-3 top-8 h-6 w-6 rounded-full border border-border bg-background shadow-inner" />

      <div className="flex items-start justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Sungurasmart / field record</span>
        <span>#0231</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Tag</p>
          <p className="text-2xl font-semibold text-card-foreground">NZW-0231</p>
        </div>
        <span className="rounded-full bg-primary px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-primary-foreground">
          Active
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-y-3 border-t border-dashed border-border pt-4 text-sm">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Breed</dt>
          <dd className="text-card-foreground">New Zealand White</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Cage</dt>
          <dd className="text-card-foreground">Row A · 12</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Weight</dt>
          <dd className="text-card-foreground">2.4 kg</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Kindle due</dt>
          <dd className="text-card-foreground">6 days</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-end gap-1 border-t border-dashed border-border pt-4">
        {[3, 5, 4, 6, 7, 6.5, 8].map((h, i) => (
          <div
            key={i}
            className="w-3 rounded-sm bg-accent/80"
            style={{ height: `${h * 4}px` }}
          />
        ))}
        <span className="ml-2 pb-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          weight log
        </span>
      </div>
    </div>
  )
}
