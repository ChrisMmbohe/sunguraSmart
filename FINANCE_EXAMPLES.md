# Finance Dashboard - API & Component Examples

## 📝 API Request Examples

### Request 1: Last 30 Days (Default)
```bash
GET /api/finance?period=30d&userId=test-user
```

### Request 2: Last 7 Days
```bash
GET /api/finance?period=7d&userId=test-user
```

### Request 3: Year to Date
```bash
GET /api/finance?period=ytd&userId=test-user
```

### Request 4: All Time
```bash
GET /api/finance?period=all&userId=test-user
```

---

## 📊 Sample API Response

```json
{
  "totalRevenue": 5230.50,
  "totalExpenses": 2100.75,
  "netProfit": 3129.75,
  "profitMargin": 59.8,
  "revenueByType": [
    {
      "type": "Rabbit",
      "amount": 3500.00,
      "count": 14
    },
    {
      "type": "ByProduct",
      "amount": 1530.50,
      "count": 45
    },
    {
      "type": "Other",
      "amount": 200.00,
      "count": 2
    }
  ],
  "expensesByCategory": [
    {
      "category": "Feed",
      "amount": 1200.00,
      "count": 12
    },
    {
      "category": "Medical",
      "amount": 450.00,
      "count": 3
    },
    {
      "category": "Cages/Equipment",
      "amount": 300.00,
      "count": 2
    },
    {
      "category": "Labor",
      "amount": 150.00,
      "count": 1
    }
  ],
  "recentSales": [
    {
      "id": "507f1f77bcf86cd799439011",
      "transaction_date": "2025-12-20",
      "amount_usd": 450.00,
      "item_type": "Rabbit",
      "byproduct_type": null,
      "quantity_sold": 3
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "transaction_date": "2025-12-19",
      "amount_usd": 85.50,
      "item_type": "ByProduct",
      "byproduct_type": "Manure",
      "quantity_sold": 25
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "transaction_date": "2025-12-18",
      "amount_usd": 250.00,
      "item_type": "Rabbit",
      "byproduct_type": null,
      "quantity_sold": 2
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "transaction_date": "2025-12-17",
      "amount_usd": 62.00,
      "item_type": "ByProduct",
      "byproduct_type": "Urine",
      "quantity_sold": 10
    },
    {
      "id": "507f1f77bcf86cd799439015",
      "transaction_date": "2025-12-16",
      "amount_usd": 125.00,
      "item_type": "ByProduct",
      "byproduct_type": "Pelts",
      "quantity_sold": 5
    }
  ],
  "recentExpenses": [
    {
      "id": "607f1f77bcf86cd799439011",
      "transaction_date": "2025-12-20",
      "amount_usd": 250.00,
      "category": "Feed",
      "description": "Pellet feed 50lb bags"
    },
    {
      "id": "607f1f77bcf86cd799439012",
      "transaction_date": "2025-12-18",
      "amount_usd": 125.00,
      "category": "Medical",
      "description": "Veterinary checkup and vaccinations"
    },
    {
      "id": "607f1f77bcf86cd799439013",
      "transaction_date": "2025-12-15",
      "amount_usd": 200.00,
      "category": "Feed",
      "description": "Hay and timothy grass purchase"
    },
    {
      "id": "607f1f77bcf86cd799439014",
      "transaction_date": "2025-12-14",
      "amount_usd": 150.00,
      "category": "Cages/Equipment",
      "description": "Replacement cage doors and locks"
    },
    {
      "id": "607f1f77bcf86cd799439015",
      "transaction_date": "2025-12-10",
      "amount_usd": 75.00,
      "category": "Labor",
      "description": "Temporary help for facility cleaning"
    }
  ],
  "dailyTrends": [
    {
      "date": "2025-12-10",
      "revenue": 125.00,
      "expenses": 75.00
    },
    {
      "date": "2025-12-11",
      "revenue": 0.00,
      "expenses": 200.00
    },
    {
      "date": "2025-12-12",
      "revenue": 310.50,
      "expenses": 0.00
    },
    {
      "date": "2025-12-13",
      "revenue": 150.00,
      "expenses": 0.00
    },
    {
      "date": "2025-12-14",
      "revenue": 62.00,
      "expenses": 150.00
    },
    {
      "date": "2025-12-15",
      "revenue": 250.00,
      "expenses": 200.00
    },
    {
      "date": "2025-12-16",
      "revenue": 125.00,
      "expenses": 0.00
    },
    {
      "date": "2025-12-17",
      "revenue": 0.00,
      "expenses": 450.00
    },
    {
      "date": "2025-12-18",
      "revenue": 250.00,
      "expenses": 125.00
    },
    {
      "date": "2025-12-19",
      "revenue": 85.50,
      "expenses": 0.00
    },
    {
      "date": "2025-12-20",
      "revenue": 450.00,
      "expenses": 250.00
    }
  ]
}
```

---

## 🔧 Component Usage Examples

### Using KPICard

```tsx
import { KPICard } from '@/components/finance/KPICard';
import { DollarSign } from 'lucide-react';

export function MyDashboard() {
  return (
    <KPICard
      title="Monthly Revenue"
      value={5230.50}
      description="from 61 sales"
      prefix="$"
      icon={<DollarSign className="h-8 w-8" />}
      variant="success"
      trend="up"
      trendValue={12.5}
    />
  );
}
```

### Using PeriodSelector

```tsx
import { PeriodSelector } from '@/components/finance/PeriodSelector';
import { useState } from 'react';

export function MyDashboard() {
  const [period, setPeriod] = useState('30d');

  return (
    <PeriodSelector
      selectedPeriod={period}
      onPeriodChange={setPeriod}
    />
  );
}
```

### Using RevenueExpenseChart

```tsx
import { RevenueExpenseChart } from '@/components/finance/RevenueExpenseChart';

export function MyDashboard() {
  const trendData = [
    { date: '2025-12-10', revenue: 125.00, expenses: 75.00 },
    { date: '2025-12-11', revenue: 0.00, expenses: 200.00 },
    { date: '2025-12-12', revenue: 310.50, expenses: 0.00 },
  ];

  return (
    <RevenueExpenseChart
      data={trendData}
      isLoading={false}
    />
  );
}
```

### Using CategoryBreakdown

```tsx
import { CategoryBreakdown } from '@/components/finance/CategoryBreakdown';

export function MyDashboard() {
  const expenseData = [
    { category: 'Feed', amount: 1200.00, count: 12 },
    { category: 'Medical', amount: 450.00, count: 3 },
    { category: 'Cages/Equipment', amount: 300.00, count: 2 },
  ];

  return (
    <CategoryBreakdown
      title="Expenses by Category"
      description="Distribution of farm expenses"
      data={expenseData}
      isLoading={false}
    />
  );
}
```

---

## 🧠 Data Fetching Pattern

### In a Client Component

```tsx
'use client';

import { useEffect, useState } from 'react';

export function FinanceData() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/finance?period=30d&userId=test-user');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h1>Total Revenue: ${data.totalRevenue}</h1>
      <h1>Total Expenses: ${data.totalExpenses}</h1>
    </div>
  );
}
```

---

## 🎨 Styling Examples

### Custom Variant Colors

```tsx
// In your component
const variantColors = {
  'success': 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950',
  'danger': 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950',
  'warning': 'border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950',
};

<div className={variantColors[variant]}>
  {/* Content */}
</div>
```

### Responsive Grid

```tsx
// 4 columns on desktop, 2 on tablet, 1 on mobile
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <KPICard {...props} />
  <KPICard {...props} />
  <KPICard {...props} />
  <KPICard {...props} />
</div>
```

---

## 🔍 Date Range Logic

The API handles these period transformations:

```typescript
'7d'  → Current date minus 7 days
'30d' → Current date minus 30 days
'90d' → Current date minus 90 days
'ytd' → January 1st of current year
'all' → January 1st, 2000 (all records)
```

Example in code:
```typescript
function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    // ... more cases
  }

  start.setHours(0, 0, 0, 0);
  return { start, end };
}
```

---

## 📱 Mobile Responsive Example

```tsx
// This layout responds to screen size
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Mobile: 1 column (full width) */}
  {/* Tablet (768px+): 2 columns */}
  {/* Desktop (1024px+): 4 columns */}
</div>

// For charts
<div className="w-full overflow-x-auto">
  {/* Scrollable on mobile, full width on desktop */}
</div>
```

---

## ✨ Loading State Pattern

```tsx
{isLoading ? (
  // Show skeletons while loading
  <div className="space-y-2">
    {[1, 2, 3, 4].map((i) => (
      <Skeleton key={i} className="h-32 w-full rounded-lg" />
    ))}
  </div>
) : data ? (
  // Show actual content when data arrives
  <div>
    {/* Content here */}
  </div>
) : null}
```

---

## 🚨 Error Handling Pattern

```tsx
{error && (
  <div className="flex items-center gap-2 text-sm text-red-600">
    <AlertCircle className="h-4 w-4" />
    <span>{error}</span>
  </div>
)}
```

---

## 📊 Color Palette Reference

```
Revenue/Success
└─ #10b981 (Tailwind: green-500)
   └─ Dark text: text-green-600
   └─ Background: bg-green-50 / dark:bg-green-950

Expenses/Warning
└─ #f59e0b (Tailwind: amber-400)
   └─ Dark text: text-amber-600
   └─ Background: bg-amber-50 / dark:bg-amber-950

Danger/Loss
└─ #ef4444 (Tailwind: red-500)
   └─ Dark text: text-red-600
   └─ Background: bg-red-50 / dark:bg-red-950

Neutral/Text
└─ #6b7280 (Tailwind: gray-500)
   └─ Muted: text-muted-foreground
```

---

## 🔗 Integration with Existing Pages

The Finance dashboard integrates seamlessly:

```
App Layout
├── Sidebar (AppSidebar)
│   ├── Dashboard → /dashboard
│   ├── Rabbits → /rabbits
│   ├── ...
│   └── Finances → /finances ← NEW
│
├── Header (SiteHeader)
│   └── Navigation controls
│
└── Content (SidebarInset)
    └── Page content
        └── FinancePageClient (if on Finances page)
```

---

## 📈 Extending the Dashboard

### To add a new time period:

1. Update `getDateRange()` in `app/api/finance/route.ts`:
```typescript
case 'custom': {
  // your logic
  break;
}
```

2. Update period options in `PeriodSelector.tsx`:
```typescript
const periods = [
  // ... existing
  { id: 'custom', label: 'Custom Range' },
];
```

### To add a new expense category:

1. Update database schema in `database/expense.model.ts`:
```typescript
enum: ['Feed', 'Medical', ..., 'NewCategory']
```

2. Data automatically flows through API to breakdown chart

---

## 🧪 Testing the Dashboard

### Test 1: Load Dashboard
```
1. Navigate to /finances
2. Verify page loads without errors
3. Check console for warnings
```

### Test 2: Period Selection
```
1. Click "Last 7 Days"
2. Verify KPI values change
3. Verify chart updates
4. Repeat for other periods
```

### Test 3: Data Display
```
1. Verify all 4 KPI cards show
2. Verify chart renders with bars
3. Verify both breakdowns show data
4. Verify transaction lists populate
```

### Test 4: Responsive
```
1. Resize browser to mobile width
2. Verify layout stacks vertically
3. Resize to tablet width
4. Verify 2-column layout
5. Resize to desktop
6. Verify 4-column KPI grid
```

---

**Examples Updated**: December 25, 2025
