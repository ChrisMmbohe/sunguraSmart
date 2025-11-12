import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import Link from "next/link";
import {  
  DollarSign,
  LineChart,
  Rabbit,
  Shield,
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
       {/* Statistics Section */}
          <section >
            <div className="grid md:grid-cols-4 gap-6 ">
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
                { title: "Health Score", 
                  metric: "96%", 
                  icon: <Shield /> },
                { title: "Revenue", 
                  metric: "KShs. 12,000", 
                  icon: <DollarSign /> },
                  
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center p-6 rounded-xl bg-muted/50 shadow-md dark:shadow-muted hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="text-primary mb-2">{stat.icon}</div>
                  <h3 className="text-2xl font-bold mb-1">{stat.metric}</h3>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              ))}
            </div>
          </section>
       </div> 
        
      </SidebarInset>
    </SidebarProvider>
  )
}
