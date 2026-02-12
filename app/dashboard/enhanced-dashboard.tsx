"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { InteractiveChart } from "@/components/InteractiveChart";
import { RecentActivity, type ActivityItem } from "@/components/RecentActivity";
import { AlertBanner } from "@/components/AlertBanner";
import { QuickActions, DEFAULT_QUICK_ACTIONS } from "@/components/QuickActions";
import { UpcomingTasks, type UpcomingTask } from "@/components/UpcomingTasks";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, Users, Zap } from "lucide-react";
import { addDays, subDays } from "date-fns";

interface DashboardData {
  stats: {
    totalRabbits: number;
    activeBreeding: number;
    recentSales: number;
    healthAlerts: number;
  };
  trends: {
    rabbits: number;
    breeding: number;
    sales: number;
    health: number;
  };
  chartData: Array<{
    date: string;
    rabbits: number;
    sales: number;
    vaccinations: number;
    weights: number;
  }>;
  activities: ActivityItem[];
  tasks: UpcomingTask[];
  alerts: Array<{
    id: string;
    type: "error" | "warning" | "success";
    title: string;
    description: string;
    dismissible?: boolean;
  }>;
}

interface EnhancedDashboardProps {
  initialData?: DashboardData;
  userId?: string;
}

// Mock data generator
const generateMockChartData = () => {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: date.toISOString().split("T")[0],
      rabbits: Math.floor(Math.random() * 15) + 45,
      sales: Math.floor(Math.random() * 8) + 2,
      vaccinations: Math.floor(Math.random() * 5),
      weights: Math.floor(Math.random() * 20) + 50,
    });
  }
  return data;
};

const generateMockActivities = (): ActivityItem[] => [
  {
    id: "1",
    type: "breeding",
    title: "Breeding Recorded",
    description: "Luna (ID: R001) bred with Max (ID: R002)",
    timestamp: subDays(new Date(), 0),
    status: "success",
    href: "/breeding",
  },
  {
    id: "2",
    type: "litter",
    title: "Litter Born",
    description: "Luna gave birth to 8 kits",
    timestamp: subDays(new Date(), 2),
    status: "success",
    href: "/litters",
  },
  {
    id: "3",
    type: "health",
    title: "Health Alert",
    description: "Daisy showing signs of respiratory distress",
    timestamp: subDays(new Date(), 1),
    status: "alert",
    href: "/health",
  },
  {
    id: "4",
    type: "sale",
    title: "Rabbits Sold",
    description: "4 rabbits sold to local buyer",
    timestamp: subDays(new Date(), 3),
    status: "success",
    href: "/finances",
  },
  {
    id: "5",
    type: "milestone",
    title: "Breeding Goal Met",
    description: "Monthly breeding target achieved",
    timestamp: subDays(new Date(), 5),
    status: "info",
  },
];

const generateMockTasks = (): UpcomingTask[] => [
  {
    id: "t1",
    title: "Weaning Day - Litter #5",
    description: "Separate kits from Luna",
    dueDate: addDays(new Date(), 3),
    priority: "high",
    type: "weaning",
    href: "/litters",
    isDismissible: true,
  },
  {
    id: "t2",
    title: "Vaccination Due",
    description: "Vaccinate 6-week-old kits",
    dueDate: addDays(new Date(), 1),
    priority: "critical",
    type: "vaccination",
    href: "/health",
    isDismissible: true,
  },
  {
    id: "t3",
    title: "Breeding Window - Luna",
    description: "Luna is receptive to breeding",
    dueDate: new Date(),
    priority: "high",
    type: "breeding",
    href: "/breeding",
    isDismissible: true,
  },
  {
    id: "t4",
    title: "Weight Check",
    description: "Check growth of weaned kits",
    dueDate: addDays(new Date(), 7),
    priority: "medium",
    type: "other",
    isDismissible: true,
  },
  {
    id: "t5",
    title: "Nesting Box Prep",
    description: "Prepare boxes for upcoming litter",
    dueDate: addDays(new Date(), 10),
    priority: "low",
    type: "nest",
    isDismissible: true,
  },
];

const generateMockAlerts = () => [
  {
    id: "alert-1",
    type: "warning" as const,
    title: "Low Feed Stock",
    description: "Feed inventory below 20% - reorder soon",
    dismissible: true,
  },
  {
    id: "alert-2",
    type: "error" as const,
    title: "Health Alert",
    description: "2 rabbits showing signs of illness - immediate attention required",
    dismissible: false,
  },
];

export function EnhancedDashboard({
  initialData,
  userId,
}: EnhancedDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [dismissedActivities, setDismissedActivities] = useState<Set<string>>(
    new Set()
  );
  const [dismissedTasks, setDismissedTasks] = useState<Set<string>>(
    new Set()
  );

  // Load data on mount
  useEffect(() => {
    if (!initialData) {
      // Simulate loading data
      const timer = setTimeout(() => {
        setData({
          stats: {
            totalRabbits: 42,
            activeBreeding: 8,
            recentSales: 12,
            healthAlerts: 2,
          },
          trends: {
            rabbits: 5,
            breeding: 12,
            sales: 8,
            health: -15,
          },
          chartData: generateMockChartData(),
          activities: generateMockActivities(),
          tasks: generateMockTasks(),
          alerts: generateMockAlerts(),
        });
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [initialData]);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`stat-${i}`} className="h-32" />
          ))}
        </div>
        {/* Chart Skeleton */}
        <Skeleton className="h-96" />
      </div>
    );
  }

  const filteredActivities = Array.from(dismissedActivities).length > 0
    ? data.activities.filter((a) => !dismissedActivities.has(a.id))
    : data.activities;

  const filteredTasks = Array.from(dismissedTasks).length > 0
    ? data.tasks.filter((t) => !dismissedTasks.has(t.id))
    : data.tasks;

  const visibleAlerts = data.alerts.filter((a) => !dismissedAlerts.has(a.id));

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {visibleAlerts.length > 0 && (
        <div className="space-y-3">
          {visibleAlerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              type={alert.type}
              title={alert.title}
              description={alert.description}
              icon={alert.type === "error" ? AlertCircle : undefined}
              dismissible={alert.dismissible}
              onDismiss={() => {
                const newSet = new Set(dismissedAlerts);
                newSet.add(alert.id);
                setDismissedAlerts(newSet);
              }}
            />
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Rabbits"
          value={data.stats.totalRabbits}
          unit="rabbits"
          trend={data.trends.rabbits}
          color="primary"
          icon={<Users className="h-5 w-5" />}
          href="/rabbits"
          tooltipContent="View all rabbits in the system"
          details={[
            { label: "Does", value: "18" },
            { label: "Bucks", value: "14" },
            { label: "Kits", value: "10" },
          ]}
        />
        <StatCard
          title="Active Breeding"
          value={data.stats.activeBreeding}
          unit="does breeding"
          trend={data.trends.breeding}
          color="success"
          icon={<TrendingUp className="h-5 w-5" />}
          href="/breeding"
          tooltipContent="View breeding records"
          details={[
            { label: "Scheduled", value: "3" },
            { label: "In Progress", value: "5" },
          ]}
        />
        <StatCard
          title="Recent Sales"
          value={data.stats.recentSales}
          unit="this month"
          trend={data.trends.sales}
          color="info"
          icon={<TrendingUp className="h-5 w-5" />}
          href="/finances"
          tooltipContent="View sales and finances"
          details={[
            { label: "Revenue", value: "$450" },
            { label: "Profit Margin", value: "35%" },
          ]}
        />
        <StatCard
          title="Health Alerts"
          value={data.stats.healthAlerts}
          unit="active alerts"
          trend={data.trends.health}
          color={data.stats.healthAlerts > 0 ? "warning" : "success"}
          icon={<Zap className="h-5 w-5" />}
          href="/health"
          tooltipContent="View health records"
          details={[
            { label: "Requiring Action", value: "2" },
            { label: "Monitoring", value: "1" },
          ]}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions
        actions={DEFAULT_QUICK_ACTIONS}
        title="Quick Actions"
        layout="grid"
        showDescriptions={false}
      />

      {/* Charts and Upcoming Tasks Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="xl:col-span-2">
          <InteractiveChart
            title="Farm Overview"
            description="30-day metrics across all operations"
            data={data.chartData}
            type="line"
            dataKeys={["rabbits", "sales", "vaccinations", "weights"]}
            height={400}
            timeRange={selectedTimeRange}
            onTimeRangeChange={setSelectedTimeRange}
            showExport={true}
            showFullscreen={true}
            tooltip={{ enabled: true }}
            legend={{ enabled: true }}
            isLoading={false}
          />
        </div>

        {/* Upcoming Tasks Sidebar */}
        <div className="xl:col-span-1">
          <UpcomingTasks
            tasks={filteredTasks}
            isLoading={false}
            maxItems={6}
            onDismiss={(taskId) => {
              const newSet = new Set(dismissedTasks);
              newSet.add(taskId);
              setDismissedTasks(newSet);
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity
        activities={filteredActivities}
        isLoading={false}
        maxItems={6}
        onActivityRemove={(activityId) => {
          const newSet = new Set(dismissedActivities);
          newSet.add(activityId);
          setDismissedActivities(newSet);
        }}
        showRemove={true}
      />

      {/* Secondary Charts Grid (Optional) */}
      {data.chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InteractiveChart
            title="Sales Trend"
            description="Weekly sales performance"
            data={data.chartData}
            type="bar"
            dataKeys={["sales"]}
            height={300}
            timeRange="30d"
            showExport={false}
            showFullscreen={false}
            tooltip={{ enabled: true }}
            legend={{ enabled: false }}
            colors={["hsl(var(--chart-2))"] as any}
          />
          <InteractiveChart
            title="Breeding Distribution"
            description="Current breeding status breakdown"
            data={[
              { name: "Active", value: 8 },
              { name: "Scheduled", value: 3 },
              { name: "Recovery", value: 2 },
            ]}
            type="pie"
            dataKeys={["value"]}
            height={300}
            showExport={false}
            showFullscreen={false}
            tooltip={{ enabled: true }}
            legend={{ enabled: true }}
          />
        </div>
      )}
    </div>
  );
}

export type { EnhancedDashboardProps, DashboardData };
