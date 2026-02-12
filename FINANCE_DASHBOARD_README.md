# Finance/Profit & Loss Dashboard - Implementation Guide

## 📋 Overview

This document describes the complete Finance/Profit & Loss (P&L) dashboard implementation for the rabbit farm management application. The dashboard provides a comprehensive view of the farm's financial performance with KPIs, charts, and detailed transaction breakdowns.

## 📁 File Structure

```
sunguch_3/
├── app/
│   ├── api/
│   │   └── finance/
│   │       └── route.ts          # Finance data API endpoint
│   └── finances/
│       ├── page.tsx              # Main Finance page (server component)
│       └── finances-page-client.tsx  # Finance page client component
├── components/
│   └── finance/
│       ├── KPICard.tsx           # Key Performance Indicator card component
│       ├── PeriodSelector.tsx    # Time period selector buttons
│       ├── RevenueExpenseChart.tsx # Daily trends chart
│       └── CategoryBreakdown.tsx # Revenue/Expense breakdown visualization
```

## 🔌 API Endpoint

### GET `/api/finance`

**Query Parameters:**
- `period` (optional): '7d', '30d', '90d', 'ytd', 'all' (default: '30d')
- `userId` (optional): User identifier for data filtering (default: 'test-user')

**Response Structure:**
```typescript
{
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueByType: Array<{ type: string; amount: number; count: number }>;
  expensesByCategory: Array<{ category: string; amount: number; count: number }>;
  recentSales: Array<{
    id: string;
    transaction_date: string;
    amount_usd: number;
    item_type: string;
    byproduct_type?: string;
    quantity_sold: number;
  }>;
  recentExpenses: Array<{
    id: string;
    transaction_date: string;
    amount_usd: number;
    category: string;
    description: string;
  }>;
  dailyTrends?: Array<{
    date: string;
    revenue: number;
    expenses: number;
  }>;
}
```

## 🧩 Components

### KPICard

Displays a single key performance indicator with optional trend information.

**Props:**
```typescript
interface KPICardProps {
  title: string;                    // Card title/label
  value: string | number;           // Main metric value
  description?: string;             // Supporting text
  icon?: ReactNode;                 // Optional icon
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;              // Percentage change
  suffix?: string;                  // Value suffix (e.g., "%")
  prefix?: string;                  // Value prefix (e.g., "$")
  variant?: 'default' | 'success' | 'danger' | 'warning';
}
```

**Usage:**
```tsx
<KPICard
  title="Total Revenue"
  value={data.totalRevenue}
  prefix="$"
  variant="success"
  icon={<DollarSign className="h-8 w-8" />}
/>
```

### PeriodSelector

Button group for selecting time periods for data analysis.

**Props:**
```typescript
interface PeriodSelectorProps {
  selectedPeriod: string;           // Currently selected period
  onPeriodChange: (period: string) => void;
}
```

**Available Periods:**
- `7d`: Last 7 Days
- `30d`: Last 30 Days
- `90d`: Last 90 Days
- `ytd`: Year to Date
- `all`: All Time

### RevenueExpenseChart

Bar chart showing daily revenue vs. expenses trends.

**Props:**
```typescript
interface RevenueExpenseChartProps {
  data: TrendData[];
  isLoading?: boolean;
}

interface TrendData {
  date: string;        // ISO date string (YYYY-MM-DD)
  revenue: number;     // Daily revenue in USD
  expenses: number;    // Daily expenses in USD
}
```

### CategoryBreakdown

Horizontal bar breakdown visualization for revenue types or expense categories.

**Props:**
```typescript
interface CategoryBreakdownProps {
  title: string;
  description: string;
  data: BreakdownItem[];
  isLoading?: boolean;
}

interface BreakdownItem {
  type?: string;       // For revenue breakdown
  category?: string;   // For expense breakdown
  amount: number;      // Amount in USD
  count: number;       // Number of transactions
}
```

## 🎨 Styling & Theme

All components use:
- **Tailwind CSS** for responsive design
- **shadcn/ui components** (Card, Badge, Button, Skeleton)
- **CSS variables** from `app/globals.css` for theming
- **Color scheme:**
  - Revenue/Success: Green (`#10b981` / `text-green-600`)
  - Expenses/Warning: Red/Amber (`#ef4444` / `#f59e0b`)
  - Charts: Multi-color palette from CSS variables

## 📊 Key Features

### 1. **KPI Dashboard**
- **Total Revenue**: Sum of all sales (rabbits, by-products)
- **Total Expenses**: Sum of all expense categories
- **Net Profit/Loss**: Revenue - Expenses with color coding
- **Profit Margin %**: (Net Profit / Total Revenue) * 100

### 2. **Time Period Selection**
- Quick filter buttons for common date ranges
- Updates all dashboard data on selection
- Default to Last 30 Days

### 3. **Revenue vs Expenses Chart**
- Daily trend visualization
- Dual-bar chart (green for revenue, red for expenses)
- Responsive to container width
- Hover tooltips showing exact values

### 4. **Revenue Breakdown**
- Pie/bar visualization by item type:
  - Rabbit
  - ByProduct
  - Other
- Shows dollar amount and percentage
- Transaction count per type

### 5. **Expense Breakdown**
- Bar chart by category:
  - Feed
  - Medical
  - Cages/Equipment
  - Labor
  - Utility
  - RabbitPurchase
  - Other
- Dollar amount and percentage
- Transaction count per category

### 6. **Recent Transactions**
- **Top 5 Sales**: Latest revenue transactions with dates and quantities
- **Top 5 Expenses**: Latest expense transactions with categories and descriptions
- Green text for sales, red text for expenses
- Date formatting: "MMM DD, YY"

## 🔄 Data Flow

```
User selects period
    ↓
FinancePageClient state updates
    ↓
useEffect fetches /api/finance with period
    ↓
API queries MongoDB (Sale & Expense collections)
    ↓
Aggregation pipeline processes data:
   - Summary (total, count)
   - By type/category breakdown
   - Recent transactions
   - Daily trends
    ↓
Components render with fetched data
```

## 📱 Responsive Design

- **Mobile (< 768px)**:
  - KPI cards stack vertically
  - Charts full width with horizontal scroll
  - Period selector wraps to multiple rows
  - Transaction lists collapse to essential info

- **Tablet (768px - 1024px)**:
  - KPI grid: 2 columns
  - Charts: Full width
  - Breakdowns: Side by side

- **Desktop (> 1024px)**:
  - KPI grid: 4 columns
  - Main chart: Full width
  - Breakdowns: 2 columns
  - Transactions: 2 columns

## ♿ Accessibility

- ARIA labels on all interactive elements
- Semantic HTML structure
- Sufficient color contrast ratios
- Keyboard navigation support
- Loading states with Skeleton components
- Error messages clearly displayed

## 🔐 Security Considerations

- User ID filtering in API (currently 'test-user')
- Date range validation in `getDateRange()` function
- MongoDB aggregation pipeline prevents injection
- Server-side data processing before client rendering

## 🚀 Usage Instructions

### 1. **Access the Dashboard**
Navigate to `/finances` from the sidebar. Finances menu item is already configured in `app-sidebar.tsx`.

### 2. **Select Time Period**
Use the period selector buttons at the top to filter data:
- Click a button to update all metrics and charts
- Default is Last 30 Days

### 3. **Interpret KPI Cards**
- Green cards indicate positive metrics
- Red/Warning cards indicate losses or high expenses
- Trend indicators show percentage changes

### 4. **Analyze Charts**
- Revenue vs Expenses: Look for trends of growing revenue with controlled expenses
- Breakdowns: Identify which products/categories drive revenue or consume expenses

### 5. **Review Recent Transactions**
- Top sales show best-performing products
- Recent expenses help track spending patterns

## 📈 Future Enhancements

1. **Advanced Charts**
   - Interactive Recharts integration
   - Stacked bar charts
   - Area charts for cumulative trends

2. **Export Functionality**
   - PDF export of P&L reports
   - CSV export for spreadsheet analysis

3. **Forecasting**
   - Predictive trends based on historical data
   - Budget vs. actual comparisons

4. **Custom Date Ranges**
   - Date picker for custom periods
   - Comparison of two periods

5. **Drill-down Details**
   - Click on categories to view transactions
   - Detailed transaction history

## 🐛 Troubleshooting

### No Data Displayed
1. Check MongoDB connection and seed data
2. Verify user ID matches data in database
3. Check browser console for API errors

### Chart Not Rendering
1. Ensure `dailyTrends` data is present in API response
2. Check for NaN or undefined values in data
3. Verify CSS is loading correctly

### Styling Issues
1. Verify Tailwind CSS configuration
2. Check that `globals.css` is properly imported
3. Clear Next.js cache: `rm -rf .next`

## 📝 Development Notes

- API uses MongoDB aggregation for efficient data processing
- Client-side state manages period selection
- Components are fully reusable across the application
- Error handling includes user-friendly messages
- Loading states prevent UI jumping

---

**Last Updated:** December 25, 2025
**Version:** 1.0.0
