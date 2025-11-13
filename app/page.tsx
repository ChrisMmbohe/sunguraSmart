import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  ClipboardCheck,
  Database,
  LineChart,
  Rabbit,
  Shield,
  Zap,
} from "lucide-react"

export default function Page() {
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
        <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
          {/* Hero Section */}
          <section className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl bg-muted/50 shadow-2xl dark:shadow-muted transition-shadow duration-300">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Streamline Your Rabbit Farm Management
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              The complete software solution for modern rabbit farming
              operations. Track breeding, manage inventory, and optimize
              production with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/demo">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                Book a Demo
              </Button>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-12">
            <h2 className="text-3xl font-bold text-center mb-12">
              Comprehensive Farm Management
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-muted/50 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300">
                <Database className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">
                  Breeding Management
                </h3>
                <p className="text-muted-foreground">
                  Track genealogy, breeding cycles, and litter performance with
                  our advanced database
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-muted/50 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300">
                <BarChart2 className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">
                  Production Analytics
                </h3>
                <p className="text-muted-foreground">
                  Real-time insights into farm performance, costs, and growth
                  metrics
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-muted/50 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300">
                <ClipboardCheck className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Health Tracking</h3>
                <p className="text-muted-foreground">
                  Monitor health records, vaccinations, and medical treatments
                </p>
              </div>
            </div>
          </section>

          {/* Statistics Section */}
          <section className="py-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Real-Time Insights</h2>
              <Button variant="outline" asChild>
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Breeding Success Rate",
                  metric: "94%",
                  icon: <Rabbit />,
                },
                {
                  title: "Average Litter Size",
                  metric: "8.5",
                  icon: <LineChart />,
                },
                { title: "Health Score", metric: "96%", icon: <Shield /> },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center p-6 rounded-xl bg-muted/50 shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="text-primary mb-2">{stat.icon}</div>
                  <h3 className="text-2xl font-bold mb-1">{stat.metric}</h3>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-12">
            <div className="bg-muted/50 rounded-xl p-8 text-center shadow-2xl dark:shadow-muted hover:shadow-lg transition-shadow duration-300">
              <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Optimize Your Rabbit Farm?
              </h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join successful rabbit farmers who have increased their
                productivity by up to 40%
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/pricing">
                    View Pricing Plans <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline">
                  Contact Sales
                </Button>
              </div>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
