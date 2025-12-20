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
  Loader2,
  HeartPulse,
  AlertTriangle,
  Baby,
  Utensils,
  Home,
  Skull, // Import Loader icon for loading state
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
  totalRevenue: string;
  population?: {
    total: number;
    active: number;
    quarantined: number;
  };
  breeding?: {
    kindling_rate_pct: number;
    weaning_survival_rate_pct: number;
    avg_litter_size: number;
    active_litters: number;
    kits_born_this_month: number;
  };
  financial?: {
    income: number;
    profit: number;
  };
  health?: {
    sick: number;
    mortality_rate_pct: number;
  };
  feed?: {
    efficiency_ratio: number;
  };
  cages?: {
    occupancy_pct: number;
    available_slots: number;
  };
}

export default function Page() {
    const [stats, setStats] = useState<APIStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/stats');

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
    }, []);

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
                    <section>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Total Rabbits */}
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                                    <h3 className="tracking-tight text-sm font-medium">Total Rabbits</h3>
                                    <Rabbit className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="px-6 pb-6">
                                    {isLoading ? (
                                        <div className="h-9 w-24 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold">
                                                {stats?.population?.total?.toLocaleString() || "0"}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                <span className="text-green-600 font-medium">
                                                    +{stats?.population?.active || 0}
                                                </span>{" "}
                                                active •{" "}
                                                <span className="text-amber-600">
                                                    {stats?.population?.quarantined || 0}
                                                </span>{" "}
                                                quarantined
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Breeding Success Rate */}
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                                    <h3 className="tracking-tight text-sm font-medium">Breeding Success</h3>
                                    <HeartPulse className="h-5 w-5 text-pink-600" />
                                </div>
                                <div className="px-6 pb-6">
                                    {isLoading ? (
                                        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold text-pink-600">
                                                {stats?.breeding?.kindling_rate_pct?.toFixed(1)}%
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                <span className="text-green-600">
                                                    {stats?.breeding?.weaning_survival_rate_pct?.toFixed(1)}%
                                                </span>{" "}
                                                weaned • {stats?.breeding?.avg_litter_size?.toFixed(1)} kits avg
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Revenue & Profit */}
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                                    <h3 className="tracking-tight text-sm font-medium">Revenue</h3>
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="px-6 pb-6">
                                    {isLoading ? (
                                        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold text-green-600">
                                                ${stats?.financial?.income?.toLocaleString() || "0"}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Profit:{" "}
                                                <span
                                                    className={`font-medium ${
                                                        (stats?.financial?.profit || 0) >= 0
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    ${Math.abs(stats?.financial?.profit || 0).toLocaleString()}
                                                </span>
                                                {(stats?.financial?.profit ?? 0) >= 0 ? " ↑" : " ↓"}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Health Alerts */}
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                                    <h3 className="tracking-tight text-sm font-medium">Health Alerts</h3>
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="px-6 pb-6">
                                    {isLoading ? (
                                        <div className="h-9 w-20 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold text-red-600">
                                                {stats?.health?.sick || 0}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {stats?.health?.sick === 0 ? (
                                                    <span className="text-green-600 font-medium">All healthy!</span>
                                                ) : (
                                                    <>rabbits need attention</>
                                                )}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Active Litters */}
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                                    <h3 className="tracking-tight text-sm font-medium">Active Litters</h3>
                                    <Baby className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="px-6 pb-6">
                                    {isLoading ? (
                                        <div className="h-9 w-20 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold text-purple-600">
                                                {stats?.breeding?.active_litters || 0}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {stats?.breeding?.kits_born_this_month || 0} born this month
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Feed Efficiency */}
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                                    <h3 className="tracking-tight text-sm font-medium">Feed Efficiency</h3>
                                    <Utensils className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="px-6 pb-6">
                                    {isLoading ? (
                                        <div className="h-9 w-28 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold text-amber-600">
                                                {stats?.feed?.efficiency_ratio?.toFixed(2) || "0.00"}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                kg feed per kg gain
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Cage Occupancy */}
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                                    <h3 className="tracking-tight text-sm font-medium">Cage Occupancy</h3>
                                    <Home className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="px-6 pb-6">
                                    {isLoading ? (
                                        <div className="h-9 w-20 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold text-blue-600">
                                                {stats?.cages?.occupancy_pct?.toFixed(0)}%
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {stats?.cages?.available_slots || 0} slots free
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Mortality Rate */}
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-4">
                                    <h3 className="tracking-tight text-sm font-medium">Mortality Rate</h3>
                                    <Skull className="h-5 w-5 text-destructive" />
                                </div>
                                <div className="px-6 pb-6">
                                    {isLoading ? (
                                        <div className="h-9 w-20 bg-muted animate-pulse rounded" />
                                    ) : (
                                        <>
                                            <div className="text-3xl font-bold text-destructive">
                                                {stats?.health?.mortality_rate_pct?.toFixed(1)}%
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                last 30 days
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
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