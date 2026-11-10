import type { CSSProperties } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { FarmRecordCard } from '@/components/marketing/farm-record-card';
import {
  ArrowRight,
  ArrowUpRight,
  Baby,
  DollarSign,
  CalendarClock,
  Rabbit as RabbitIcon,
  Egg,
  LineChart,
  Milk,
  Scale,
  Stethoscope,
  Warehouse,
  Wheat,
  Wallet,
  Tags,
} from 'lucide-react';
import { dbConnect, Rabbit, Expense, Schedule, User, RabbitStatus } from '@/database';

// ---------------------------------------------------------------------------
// Data — only fetched for signed-in tenants, and kept intentionally light
// (the full breakdown lives on /dashboard; this is a snapshot, not a repeat).
// ---------------------------------------------------------------------------

interface HomeSnapshot {
  farmName: string;
  totalRabbits: number;
  activeRabbits: number;
  revenueThisMonth: number;
  profitThisMonth: number;
  scheduleDueThisWeek: number;
}

async function getHomeSnapshot(userId: string): Promise<HomeSnapshot | null> {
  await dbConnect();

  const user = await User.findByClerkId(userId);
  if (!user) return null;

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const [population, profitReport, upcomingSchedule] = await Promise.all([
    Rabbit.getPopulationStats(userId),
    Expense.getNetProfitReport(userId, firstOfMonth),
    Schedule.findUpcoming(userId, 7),
  ]);

  const active = population.byStatus.find((s) => s.status === RabbitStatus.ACTIVE)?.count ?? 0;

  return {
    farmName: user.farmName,
    totalRabbits: population.total,
    activeRabbits: active,
    revenueThisMonth: profitReport.totalRevenue,
    profitThisMonth: profitReport.netProfit,
    scheduleDueThisWeek: upcomingSchedule.length,
  };
}

const kes = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function Page() {
  const { userId } = await auth();
  const snapshot = userId ? await getHomeSnapshot(userId) : null;

  if (userId && !snapshot) redirect('/dashboard');

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 60)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        {snapshot ? <SignedInHome snapshot={snapshot} /> : <MarketingHome />}
      </SidebarInset>
    </SidebarProvider>
  );
}

// ---------------------------------------------------------------------------
// Signed-in: personalized, real, real-time snapshot
// ---------------------------------------------------------------------------

function getGreeting(hour: number): string {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function SignedInHome({ snapshot }: { snapshot: HomeSnapshot }) {
  const now = new Date();
  const profitPositive = snapshot.profitThisMonth >= 0;

  return (
    <div className="flex flex-1 flex-col gap-7 bg-background p-4 pt-4 md:p-8 md:pt-6">
      {/* Greeting — a person walking onto the farm, not a report opening */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {now.toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground md:text-3xl">
            {getGreeting(now.getHours())}, {snapshot.farmName}.
          </h1>
        </div>
        <Link
          href="/dashboard"
          className="group inline-flex items-center gap-1.5 self-start font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-primary md:self-auto"
        >
          Full dashboard & reports
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Ledger strip — one tally sheet, not a grid of report cards. Every
          figure is itself a door into the page that produced it. */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <LedgerEntry
            href="/rabbits"
            label="Rabbits on farm"
            value={snapshot.totalRabbits.toLocaleString()}
            note={`${snapshot.activeRabbits} active`}
            icon={RabbitIcon}
          />
          <LedgerEntry
            href="/finances"
            label="Revenue, this month"
            value={kes.format(snapshot.revenueThisMonth)}
            note="gross, month to date"
            icon={DollarSign}
          />
          <LedgerEntry
            href="/finances"
            label="Profit, this month"
            value={`${profitPositive ? '' : '−'}${kes.format(Math.abs(snapshot.profitThisMonth))}`}
            note={profitPositive ? 'ahead for the month' : 'running behind this month'}
            tone={profitPositive ? 'positive' : 'negative'}
            icon={Wallet}
          />
          <LedgerEntry
            href="/schedule"
            label="Due this week"
            value={String(snapshot.scheduleDueThisWeek)}
            note="tasks & kindles"
            icon={CalendarClock}
          />
        </div>
      </section>

      {/* Quick actions — logging chips. Kept separate from the directory
          below: these are "add a record", not "go look at a page". */}
      <section className="flex flex-wrap gap-2">
        <QuickAction href="/rabbits" icon={Tags} label="Log a rabbit" />
        <QuickAction href="/rabbits" icon={Scale} label="Record a weigh-in" />
        <QuickAction href="/litters" icon={Baby} label="Log a litter" />
        <QuickAction href="/health" icon={Stethoscope} label="Log a treatment" />
        <QuickAction href="/finances" icon={Wallet} label="Record a sale" />
        <QuickAction href="/feeds" icon={Wheat} label="Check feed stock" />
      </section>

      {/* Farm sections — the rest of the record, one tap away. This is the
          filler for the space below the fold, but it earns its place: it's
          a complete index of the app, not decoration. */}
      <section className="flex flex-1 flex-col">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Every part of the record
        </span>
        <div className="mt-4 grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DirectoryCard href="/rabbits" icon={RabbitIcon} title="Rabbits" desc="Population, lineage & status" />
          <DirectoryCard href="/litters" icon={Egg} title="Litters" desc="Breeding pairings & outcomes" />
          <DirectoryCard href="/health" icon={Stethoscope} title="Health" desc="Records & follow-ups" />
          <DirectoryCard href="/feeds" icon={Wheat} title="Feeds" desc="Stock & consumption" />
          <DirectoryCard href="/finances" icon={DollarSign} title="Finances" desc="Sales & expenses" />
          <DirectoryCard href="/schedule" icon={CalendarClock} title="Schedule" desc="Tasks & reminders" />
          <DirectoryCard href="/cagecards" icon={Warehouse} title="Cage Cards" desc="Occupancy & assignments" />
          <DirectoryCard href="/reports" icon={LineChart} title="Reports" desc="Deeper trends & exports" />
        </div>
      </section>
    </div>
  );
}

function LedgerEntry({
  href,
  label,
  value,
  note,
  tone = 'neutral',
  icon: Icon,
}: {
  href: string;
  label: string;
  value: string;
  note?: string;
  tone?: 'neutral' | 'positive' | 'negative';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = tone === 'positive' ? 'text-primary' : tone === 'negative' ? 'text-destructive' : 'text-foreground';

  return (
    <Link href={href} className="group relative flex flex-col gap-1.5 p-5 transition-colors hover:bg-muted/50">
      <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className={`font-mono text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</span>
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
      <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function DirectoryCard({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1 text-sm font-medium text-card-foreground">
          {title}
          <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">{desc}</span>
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Signed-out: marketing page
// ---------------------------------------------------------------------------

const LIFECYCLE = [
  { label: 'Acquire', desc: 'Register a rabbit by tag, breed, and source.' },
  { label: 'Pair', desc: 'Match doe and buck, track method and date.' },
  { label: 'Kindle', desc: 'Log litter size and mortality as it happens.' },
  { label: 'Wean', desc: 'Record weaning weight and survival rate.' },
  { label: 'Grow', desc: 'Track weight gain and feed against targets.' },
  { label: 'Sell', desc: 'Close the loop with revenue per rabbit.' },
];

const MODULES = [
  {
    icon: Milk,
    tag: 'Breeding',
    title: 'Pairings that don\u2019t fall through the cracks',
    desc: 'Every pairing gets an expected due date pulled from the breed\u2019s gestation period, with automatic alerts as kindling approaches or passes.',
  },
  {
    icon: Egg,
    tag: 'Litters',
    title: 'Mortality and weaning, tracked honestly',
    desc: 'Log losses as they happen and record weaning outcomes — survival rate and average litter size calculate themselves.',
  },
  {
    icon: Wheat,
    tag: 'Feed & Health',
    title: 'Stock levels and treatments in one place',
    desc: 'Restocks and consumption keep inventory current automatically. Health records update a rabbit\u2019s status the moment you log an outcome.',
  },
  {
    icon: DollarSign,
    tag: 'Finance',
    title: 'Know your margin, not just your revenue',
    desc: 'Sales and expenses roll up into a real profit figure per month — not a spreadsheet you have to rebuild every time.',
  },
];

function MarketingHome() {
  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      {/* Announcement strip — fills the header-to-hero gap with something real
          instead of empty top margin */}
      <div className="border-b border-border bg-secondary px-4 py-2.5 text-center text-secondary-foreground">
        <p className="text-xs sm:text-sm">
          <span className="font-mono uppercase tracking-wide text-accent">New</span>
          {' — '}
          kindle-due alerts now calculate automatically from each breed&apos;s gestation period.
        </p>
      </div>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-10 md:grid-cols-[1.1fr_1fr] md:items-center md:py-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Built for commercial rabbitries
          </span>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
            Every rabbit,
            <br />
            <span className="text-primary">tagged, tracked, accounted for.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            SunguraSmart replaces the notebook and the spreadsheet with one
            record per rabbit — breeding history, litters, feed, health, and
            what it actually earned you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start free trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/book-demo">Book a demo</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No card required. Set up your first cage in under five minutes.</p>
        </div>

        <div className="flex justify-center md:justify-end">
          <FarmRecordCard />
        </div>
      </section>

      {/* Lifecycle band — a genuine sequence, so numbering earns its place */}
      <section className="border-y border-border bg-card py-14">
        <div className="mx-auto w-full max-w-6xl px-4">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            The lifecycle every record follows
          </span>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {LIFECYCLE.map((stage, i) => (
              <div key={stage.label} className="relative pl-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-accent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <p className="mt-2 font-medium text-card-foreground">{stage.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold md:text-3xl">Four modules. One farm record.</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {MODULES.map((m) => (
            <div
              key={m.tag}
              className="rounded-2xl border border-dashed border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-accent">
                <m.icon className="h-4 w-4" />
                {m.tag}
              </div>
              <h3 className="mt-3 text-lg font-medium text-card-foreground">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-primary py-16 text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold md:text-3xl">Ready to put your farm on record?</h2>
            <p className="mt-2 max-w-md text-primary-foreground/80">
              Start free, or have someone walk you through it with your own numbers first.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Start free trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link href="/book-demo">Book a demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
