import type { Metadata } from 'next';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { DemoRequestForm } from './demo-request-form';

export const metadata: Metadata = {
  title: 'Book a Demo · SunguraSmart',
  description: 'See how SunguraSmart tracks breeding, litters, feed, and finances for your rabbit farm.',
};

export default function BookDemoPage() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 60)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col bg-background">
          <div className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 pb-14 pt-8 md:grid-cols-[1fr_1.1fr] md:gap-16 md:pb-20 md:pt-12">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Book a demo
              </span>
              <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-4xl">
                A 20-minute walkthrough, built around your farm.
              </h1>
              <p className="mt-4 text-muted-foreground">
                Tell us a bit about your operation and we&apos;ll show you exactly how
                SunguraSmart handles it — breeding pairs, litter records, feed
                stock, cage assignments, and the numbers that come out of it.
              </p>

              <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">—</span>
                  We&apos;ll load sample data that matches your farm size
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">—</span>
                  No sales pitch — a working farmer or farm manager leads the call
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">—</span>
                  Free trial starts whenever you&apos;re ready, not before
                </li>
              </ul>
            </div>

            <DemoRequestForm />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
