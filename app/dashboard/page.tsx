"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  DollarSign,
  LineChart,
  Rabbit,
  Shield,
  Loader2, // Import Loader icon for loading state
} from "lucide-react"

import { Separator } from "@/components/ui/separator"
import React, { useState, useEffect } from 'react'; // Import React hooks

// Define the shape of the statistics data
interface StatData {
  title: string;
  metric: string;
  icon: JSX.Element;
  key: keyof APIStats; // Use keys for mapping
}

// Define the shape of the data returned by your API
interface APIStats {
  breedingSuccessRate: string;
  averageLitterSize: string;
  healthScore: string;
  revenue: string;
}

export default function Page() { // Remove 'async' as data fetching is now done client-side with useEffect
    const [stats, setStats] = useState<APIStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/stats'); // Assuming your route.ts is at /api/stats

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data: APIStats = await response.json();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch statistics:", err);
                setError("Failed to load statistics. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchStats();
    }, []); // Empty dependency array ensures this runs once on mount

    // Define the structure and icons, using the stats state for the metric value
    const statCards: StatData[] = [
        {
            title: "Breeding Success Rate",
            metric: stats?.breedingSuccessRate ?? "...",
            icon: <Rabbit />,
            key: "breedingSuccessRate",
        },
        {
            title: "Average Litter Size",
            metric: stats?.averageLitterSize ?? "...",
            icon: <LineChart />,
            key: "averageLitterSize",
        },
        {
            title: "Health Score",
            metric: stats?.healthScore ?? "...",
            icon: <Shield />,
            key: "healthScore",
        },
        {
            title: "Revenue",
            metric: stats?.revenue ?? "...",
            icon: <DollarSign />,
            key: "revenue",
        },
    ];

    if (error) {
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
                        <section>
                            <div className="text-red-500 text-center p-8 border border-red-300 bg-red-50 rounded-xl">
                                Error: {error}
                            </div>
                        </section>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
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
                <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
                    {/* Statistics Section */}
                    <section >
                        <div className="grid md:grid-cols-4 gap-6 ">
                            {statCards.map((stat, i) => (
                                <div
                                    key={stat.key}
                                    className="flex flex-col items-center p-6 rounded-xl bg-muted/50 shadow-md dark:shadow-muted hover:shadow-lg transition-shadow duration-300"
                                >
                                    <div className="text-primary mb-2">{stat.icon}</div>
                                    <h3 className="text-2xl font-bold mb-1">
                                        {isLoading ? (
                                            <Loader2 className="animate-spin h-6 w-6 text-primary" />
                                        ) : (
                                            stat.metric
                                        )}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                </div>
                            ))}
                        </div>
                        <div className="container mx-auto py-10">
                            <Separator className="mb-6" />
                        </div>
                    </section>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}